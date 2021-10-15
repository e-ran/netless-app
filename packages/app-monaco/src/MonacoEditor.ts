import type { AppContext, ReadonlyTeleBox } from "@netless/window-manager";
import type { Text } from "yjs";
import { Doc } from "yjs";
import { SideEffectManager } from "side-effect-manager";
import type * as Monaco from "monaco-editor";
import type { NetlessAppMonacoAttributes } from "./typings";
import { YMonaco } from "./y-monaco";
import { Terminal } from "./Terminal";
import { Tio } from "./compiler/tio";

declare global {
  interface Window {
    MonacoEnvironment: {
      getWorker: (_: string, label: string) => Worker;
    };
  }
}

export class MonacoEditor {
  public readonly editor: Monaco.editor.IStandaloneCodeEditor;

  public readonly yBinding: YMonaco;
  public readonly yDoc: Doc;
  public readonly yText: Text;

  public readonly $container: HTMLDivElement;

  public readonly compiler = new Tio();
  public readonly terminal: Terminal;

  public constructor(
    public readonly context: AppContext<NetlessAppMonacoAttributes>,
    public readonly attrs: NetlessAppMonacoAttributes,
    public readonly box: ReadonlyTeleBox,
    public readonly monaco: typeof Monaco,
    public readonly: boolean
  ) {
    this.terminal = new Terminal(context, attrs, this.compiler);

    this.yDoc = new Doc();
    this.yText = this.yDoc.getText("monaco");

    this.$container = this.renderContainer();
    this.box.mountContent(this.$container);

    const $editor = document.createElement("div");
    $editor.className = this.wrapClassName("editor");
    this.$container.appendChild($editor);

    this.editor = this.monaco.editor.create($editor, {
      value: "",
      automaticLayout: true,
      readOnly: readonly,
      language: this.attrs.lang,
      fixedOverflowWidgets: false,
    });

    // set footer after editor creation
    const $footer = this.renderFooter();
    this.$container.appendChild($footer);

    this.yBinding = new YMonaco(
      context,
      attrs,
      box,
      this.monaco,
      this.editor,
      this.yDoc,
      this.yText,
      readonly
    );
  }

  public setReadonly(readonly: boolean): void {
    if (readonly !== this.readonly) {
      this.readonly = readonly;
      this.$container.classList.toggle(this.wrapClassName("readonly"), readonly);
      this.editor.updateOptions({ readOnly: readonly });
      this.yBinding.setReadonly(readonly);
    }
  }

  private renderContainer(): HTMLDivElement {
    const $container = document.createElement("div");
    $container.className = this.wrapClassName("editor-container");

    if (this.readonly) {
      $container.classList.add(this.wrapClassName("cursor-readonly"));
    }

    return $container;
  }

  private renderFooter(): HTMLDivElement {
    const $footer = document.createElement("div");
    $footer.className = this.wrapClassName("footer");

    if (this.readonly) {
      $footer.classList.add(this.wrapClassName("readonly"));
    }

    const $ctrl = document.createElement("div");
    $ctrl.className = this.wrapClassName("footer-ctrl");
    $footer.appendChild($ctrl);

    const $langSelect = document.createElement("select");
    $langSelect.className = this.wrapClassName("lang-select");

    this.monaco.languages.getLanguages().forEach(lang => {
      const opt = document.createElement("option");
      opt.value = lang.id;
      opt.textContent = lang.id;
      $langSelect.appendChild(opt);
    });

    $langSelect.value = this.attrs.lang;
    $ctrl.appendChild($langSelect);

    const $runCode = document.createElement("button");
    $runCode.className = this.wrapClassName("run-code");
    $runCode.textContent = "Run";
    $runCode.disabled = !this.compiler.hasLanguage(this.attrs.lang);
    $ctrl.appendChild($runCode);

    this.sideEffect.addEventListener($langSelect, "change", () => {
      const lang = $langSelect.value;
      if (!this.readonly && lang && lang !== this.attrs.lang) {
        this.context.updateAttributes(["lang"], lang);
      }
    });

    this.sideEffect.add(() =>
      this.context.mobxUtils.reaction(
        () => this.attrs.lang,
        lang => {
          if (lang) {
            this.monaco.editor.setModelLanguage(this.yBinding.monacoModel, lang);
            $langSelect.value = lang;
            $runCode.disabled = !this.compiler.hasLanguage(lang);
          }
        }
      )
    );

    this.sideEffect.add(() =>
      this.context.mobxUtils.reaction(
        () => this.attrs.codeRunning,
        codeRunning => {
          $runCode.disabled = codeRunning;
        }
      )
    );

    this.sideEffect.addEventListener($runCode, "click", async () => {
      const text = this.editor.getValue();
      if (this.readonly || !text.trim()) {
        return;
      }
      this.context.updateAttributes(["codeRunning"], true);
      await this.terminal.runCode(text, this.attrs.lang);
      this.context.updateAttributes(["codeRunning"], false);
    });

    $footer.appendChild(this.terminal.$content);

    return $footer;
  }

  public wrapClassName(className: string): string {
    return `netless-app-monaco-${className}`;
  }

  public destroy(): void {
    this.editor.dispose();
  }

  private sideEffect = new SideEffectManager();
}
