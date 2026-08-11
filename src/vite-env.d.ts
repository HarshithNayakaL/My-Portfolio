/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WEB3FORMS_KEY?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * WebMCP declarative-API attributes.
 * https://developer.chrome.com/docs/ai/webmcp/declarative-api
 *
 * Proposed standard, currently an origin trial. The attributes are all
 * lowercase, so React passes them straight through to the DOM and browsers
 * without WebMCP simply ignore them — but React's TS types don't know them,
 * hence this augmentation.
 */
declare module "react" {
  interface HTMLAttributes<T> {
    /** Tool name exposed to agents. Required on the form to register a tool. */
    toolname?: string;
    /** What the tool does and when to use it. Required alongside toolname. */
    tooldescription?: string;
    /** Submit as soon as an agent invokes the tool. Omit for anything
     *  consequential — the person should confirm. */
    toolautosubmit?: boolean;
    /** Per-field description in the generated JSON Schema. Falls back to the
     *  associated <label> text when omitted. */
    toolparamdescription?: string;
  }
}

export {};
