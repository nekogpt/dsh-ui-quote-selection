window.__ModuleLoader__.load({
	id: "dsh-ui-quote-selection",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		/** Left-align quote chips so the visible slice is the beginning of the quote
		* (the stock chip label clips centered, which surfaces the middle).
		* Scoped by the ❝ title prefix — file/image chips are untouched. */
		const chipCssTag = "dsh-ui-quote-selection/chip-align.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(chipCssTag) + "]") === null) {
			const chipStyle = document.createElement("style");
			chipStyle.dataset.plugin = "dsh-ui-quote-selection";
			chipStyle.dataset.pluginCss = chipCssTag;
			chipStyle.textContent = "[data-decoration=\"chip\"][title^=\"❝\"] > span{width:100%;justify-content:flex-start}";
			document.head.appendChild(chipStyle);
		}
		/** Trigger-source name this plugin registers in the @ pipeline (owner of every quote occurrence). */
		const SOURCE_NAME = "quote-selection";
		/** ref -> full quoted text; refs are minted per insert and survive only in this page. */
		const registry = new Map();
		/** Services required by the plugin. */
		const inject = ["slots", "sessions", "inputTriggers"];
		/** Compact single-line chip preview (left-aligned by the injected chip CSS, so the head stays visible). */
		function makePreview(text) {
			const flat = text.replace(/\s+/g, " ").trim();
			return flat.length > 20 ? flat.slice(0, 20) + "…" : flat;
		}
		function mintId() {
			if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
			return `qs-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
		}
		/**
		* Session-scoped mount inside the composer dock: owns the document-level
		* selection pill and turns a click into an official reference insert.
		*/
		function QuoteSelectionMount({ sessionId, useInput, insertQuote }) {
			const inputState = useInput((s) => s);
			const inputRef = (0, react.useRef)(inputState);
			(0, react.useEffect)(() => {
				inputRef.current = inputState;
			}, [inputState]);
			(0, react.useEffect)(() => {
				let pill = null;
				let pendingText = "";
				let raf = 0;
				const hide = () => {
					if (pill !== null) {
						pill.remove();
						pill = null;
						pendingText = "";
					}
				};
				const evaluate = () => {
					raf = 0;
					const sel = window.getSelection();
					if (sel === null || sel.isCollapsed || sel.rangeCount === 0) {
						hide();
						return;
					}
					const range = sel.getRangeAt(0);
					const node = range.commonAncestorContainer;
					const anchor = node instanceof Element ? node : node.parentElement;
					if (anchor === null) {
						hide();
						return;
					}
					const inFlow = anchor.closest("[data-chat-anchor-key]") !== null || anchor.closest("[data-chat-flow]") !== null;
					if (!inFlow) {
						hide();
						return;
					}
					const text = range.toString().trim();
					if (text === "") {
						hide();
						return;
					}
					const rect = range.getBoundingClientRect();
					const container = anchor.closest("[data-conversation-scroll]");
					const cRect = container === null ? null : container.getBoundingClientRect();
					if (cRect !== null && (rect.bottom <= cRect.top || rect.top >= cRect.bottom)) {
						hide();
						return;
					}
					pendingText = text;
					if (pill === null) {
						pill = document.createElement("button");
						pill.type = "button";
						pill.setAttribute("data-selection-quote-pill", "true");
						pill.style.cssText = "position:fixed;z-index:1000;display:flex;align-items:center;gap:6px;padding:6px 10px;border:1px solid rgba(255,255,255,0.14);border-radius:8px;background:#17181c;color:#e8e8ea;font-size:12px;line-height:1;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,0.45);font-family:inherit;";
						const zh = (document.documentElement.lang ?? "").toLowerCase().startsWith("zh");
						pill.textContent = zh ? "引用到输入框" : "Quote to composer";
						pill.addEventListener("mousedown", (event) => {
							event.preventDefault();
							event.stopPropagation();
						});
						pill.addEventListener("click", (event) => {
							event.preventDefault();
							event.stopPropagation();
							const quoted = pendingText;
							const snapshot = inputRef.current ?? {};
							const draft = typeof snapshot.draft === "string" ? snapshot.draft : "";
							const draftRev = snapshot.draftRev ?? 0;
							const caret = (() => {
								const area = document.querySelector("[data-composer-seat] textarea");
								if (!(area instanceof HTMLTextAreaElement)) return draft.length;
								const at = area.selectionStart;
								return at >= 0 && at <= draft.length ? at : draft.length;
							})();
							hide();
							const applied = insertQuote(quoted, caret, draftRev);
							if (applied) requestAnimationFrame(() => {
								const area = document.querySelector("[data-composer-seat] textarea");
								if (area instanceof HTMLTextAreaElement) {
									area.focus();
									const end = caret + 1;
									try {
										area.setSelectionRange(end, end);
									} catch (_error) {}
								}
							});
						});
						document.body.appendChild(pill);
					}
					pill.style.left = `${Math.max(8, Math.min(rect.left + rect.width / 2 - 48, window.innerWidth - 148))}px`;
					pill.style.top = `${Math.max((cRect?.top ?? 8) + 8, rect.top - 44)}px`;
				};
				const schedule = () => {
					if (raf !== 0) cancelAnimationFrame(raf);
					raf = requestAnimationFrame(evaluate);
				};
				const onMouseUp = (event) => {
					if (event.target instanceof Element && event.target.closest("[data-composer-seat]") !== null) {
						hide();
						return;
					}
					schedule();
				};
				const onScroll = () => {
					schedule();
				};
				const onKeyDown = (event) => {
					if (event.key === "Escape") hide();
				};
				document.addEventListener("mouseup", onMouseUp, true);
				document.addEventListener("selectionchange", schedule);
				document.addEventListener("scroll", onScroll, true);
				document.addEventListener("keydown", onKeyDown, true);
				return () => {
					if (raf !== 0) cancelAnimationFrame(raf);
					document.removeEventListener("mouseup", onMouseUp, true);
					document.removeEventListener("selectionchange", schedule);
					document.removeEventListener("scroll", onScroll, true);
					document.removeEventListener("keydown", onKeyDown, true);
					hide();
				};
			}, [insertQuote, sessionId]);
			return null;
		}
		/** Mounts the quote-selection plugin. */
		function apply(ctx) {
			const sessions = ctx.sessions;
			const inputTriggers = ctx.inputTriggers;
			const disposeSource = inputTriggers.registerSource({
				trigger: "@",
				name: SOURCE_NAME,
				order: 90,
				candidates: async () => [],
				onPick: () => void 0,
				codec: {
					clipboardText(ref) {
						return registry.get(ref) ?? "";
					},
					serialize(ref) {
						const text = registry.get(ref);
						if (text === void 0) throw new Error(`quote-selection: reference ${ref} data missing`);
						return text;
					}
				}
			});
			ctx.effect(() => disposeSource, "quote-selection: trigger source");
			ctx.slots.inject("conversation.input.dock", () => ctx.slots.register({
				name: "conversation.input.dock",
				id: SOURCE_NAME,
				order: 15,
				inject: (sessionId) => ({
					insertQuote: (text, caret, draftRev) => {
						const actx = sessions.scope(sessionId);
						if (actx === void 0) return false;
						const ref = mintId();
						registry.set(ref, text);
						const applied = actx.bail(actx, "slash/input-insert-reference", {
							reference: {
								source: SOURCE_NAME,
								ref,
								label: "❝ " + makePreview(text),
								clipboardText: text
							},
							span: { start: caret, end: caret, draftRev }
						});
						if (applied !== true) {
							registry.delete(ref);
							return false;
						}
						return true;
					}
				})
			}, QuoteSelectionMount));
		}
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});