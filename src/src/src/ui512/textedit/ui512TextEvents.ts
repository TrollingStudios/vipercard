
/* auto */ import { O } from '../../ui512/utils/utilsAssert.js';
/* auto */ import { getRoot } from '../../ui512/utils/utilsUI512.js';
/* auto */ import { ModifierKeys } from '../../ui512/utils/utilsDrawConstants.js';
/* auto */ import { RectUtils } from '../../ui512/utils/utilsDraw.js';
/* auto */ import { MouseDragStatus, UI512EventType } from '../../ui512/draw/ui512Interfaces.js';
/* auto */ import { FormattedText } from '../../ui512/draw/ui512FormattedText.js';
/* auto */ import { UI512ElButton } from '../../ui512/elements/ui512ElementsButton.js';
/* auto */ import { UI512ElTextField } from '../../ui512/elements/ui512ElementsTextField.js';
/* auto */ import { IdleEventDetails, KeyDownEventDetails, MouseDownDoubleEventDetails, MouseDownEventDetails, MouseMoveEventDetails, MouseUpEventDetails, PasteTextEventDetails } from '../../ui512/menu/ui512Events.js';
/* auto */ import { UI512PresenterWithMenuInterface } from '../../ui512/menu/ui512PresenterWithMenu.js';
/* auto */ import { MenuBehavior } from '../../ui512/menu/ui512MenuListeners.js';
/* auto */ import { GenericTextField, UI512ElTextFieldAsGeneric } from '../../ui512/textedit/ui512GenericField.js';
/* auto */ import { ScrollbarImpl, fldIdToScrollbarPartId, getAmountIfScrollArrowClicked } from '../../ui512/textedit/ui512Scrollbar.js';
/* auto */ import { SelAndEntry } from '../../ui512/textedit/ui512TextSelect.js';
/* auto */ import { BasicHandlers } from '../../ui512/textedit/ui512BasicHandlers.js';

export class EditTextBehavior {
    static readonly amtScrollArrowClicked = 12;
    static readonly amtScrollAreaClicked = 36;
    protected scrollbarImpl = new ScrollbarImpl();

    protected gelFromEl(el: O<UI512ElTextField>): O<GenericTextField> {
        return el ? new UI512ElTextFieldAsGeneric(el) : undefined;
    }

    protected getScrollbarImpl() {
        return this.scrollbarImpl;
    }

    onMouseDownScroll(c: UI512PresenterWithMenuInterface, d: MouseDownEventDetails) {
        if (d.button === 0 && d.el instanceof UI512ElButton) {
            let moveAmt = getAmountIfScrollArrowClicked(d.el.id);
            if (moveAmt !== undefined) {
                this.getScrollbarImpl().onScrollArrowClicked(c, d.el.id, moveAmt);
                c.mouseDragStatus = MouseDragStatus.ScrollArrow;
            }
        }
    }

    onMouseDownSelect(c: UI512PresenterWithMenuInterface, d: MouseDownEventDetails) {
        if (
            d.button === 0 &&
            d.el instanceof UI512ElTextField &&
            d.el.get_b('canselecttext') &&
            c.canSelectTextInField(d.el)
        ) {
            let gel = this.gelFromEl(d.el);
            if (!gel) {
                return;
            }

            if ((d.mods & ModifierKeys.Cmd) !== 0 || (d.mods & ModifierKeys.Opt) !== 0) {
                return;
            }

            c.setCurrentFocus(d.el.id);
            if (d.el.get_b('selectbylines')) {
                SelAndEntry.mouseClickSelectByLines(gel, d.mouseX, d.mouseY);
            } else {
                let isShift = (d.mods & ModifierKeys.Shift) !== 0;
                SelAndEntry.mouseClickPositionToSetCaret(gel, d.mouseX, d.mouseY, isShift);
                if (!isShift) {
                    c.mouseDragStatus = MouseDragStatus.SelectingText;
                }
            }
        }
    }

    onMouseMoveSelect(c: UI512PresenterWithMenuInterface, d: MouseMoveEventDetails) {
        if (c.mouseDragStatus === MouseDragStatus.SelectingText && c.trackPressedBtns[0]) {
            let el = c.app.findElemById(c.trackClickedIds[0]);
            if (
                el &&
                el instanceof UI512ElTextField &&
                el.get_b('canselecttext') &&
                c.canSelectTextInField(el) &&
                !el.get_b('selectbylines')
            ) {
                let gel = this.gelFromEl(el);
                if (gel) {
                    if (RectUtils.hasPoint(d.mouseX, d.mouseY, el.x, el.y, el.w, el.h)) {
                        SelAndEntry.mouseClickPositionAdjustSelection(gel, d.mouseX, d.mouseY);
                    }
                }
            }
        }
    }

    onMouseDoubleDown(c: UI512PresenterWithMenuInterface, d: MouseDownDoubleEventDetails) {
        if (d.button === 0) {
            if (
                d.el &&
                d.el instanceof UI512ElTextField &&
                d.el.get_b('canselecttext') &&
                c.canSelectTextInField(d.el) &&
                !d.el.get_b('selectbylines')
            ) {
                let gel = this.gelFromEl(d.el);
                if (gel) {
                    // disable the drag-to-select
                    c.mouseDragStatus = MouseDragStatus.None;
                    SelAndEntry.changeSelCurrentWord(gel);
                }
            }
        }
    }

    onMouseUp(c: UI512PresenterWithMenuInterface, d: MouseUpEventDetails) {
        c.mouseDragStatus = MouseDragStatus.None;
    }

    onKeyDown(c: UI512PresenterWithMenuInterface, d: KeyDownEventDetails) {
        let el = SelAndEntry.getSelectedField(c);
        if (el && el.get_b('selectbylines')) {
            return;
        } else if (!el || d.handled()) {
            return;
        }

        let gel = this.gelFromEl(el);
        if (!gel) {
            return;
        }

        let wasShortcut = true;
        switch (d.readableShortcut) {
            case 'Cmd+A':
                SelAndEntry.changeSelSelectAll(gel);
                break;
            case 'Backspace':
                SelAndEntry.changeTextBackspace(gel, true, false);
                break;
            case 'Cmd+Backspace':
                SelAndEntry.changeTextBackspace(gel, true, true);
                break;
            case 'Delete':
                SelAndEntry.changeTextBackspace(gel, false, false);
                break;
            case 'Cmd+Delete':
                SelAndEntry.changeTextBackspace(gel, false, true);
                break;
            case 'PageUp':
                SelAndEntry.changeSelPageUpDown(gel, true, false);
                break;
            case 'Shift+PageUp':
                SelAndEntry.changeSelPageUpDown(gel, true, true);
                break;
            case 'PageDown':
                SelAndEntry.changeSelPageUpDown(gel, false, false);
                break;
            case 'Shift+PageDown':
                SelAndEntry.changeSelPageUpDown(gel, false, true);
                break;
            case 'Home':
                SelAndEntry.changeSelGoLineHomeEnd(gel, true, false);
                break;
            case 'Shift+Home':
                SelAndEntry.changeSelGoLineHomeEnd(gel, true, true);
                break;
            case 'Cmd+Home':
                SelAndEntry.changeSelGoDocHomeEnd(gel, true, false);
                break;
            case 'Cmd+Shift+Home':
                SelAndEntry.changeSelGoDocHomeEnd(gel, true, true);
                break;
            case 'End':
                SelAndEntry.changeSelGoLineHomeEnd(gel, false, false);
                break;
            case 'Shift+End':
                SelAndEntry.changeSelGoLineHomeEnd(gel, false, true);
                break;
            case 'Cmd+End':
                SelAndEntry.changeSelGoDocHomeEnd(gel, false, false);
                break;
            case 'Cmd+Shift+End':
                SelAndEntry.changeSelGoDocHomeEnd(gel, false, true);
                break;
            case 'ArrowLeft':
                SelAndEntry.changeSelLeftRight(gel, true, false, false);
                break;
            case 'Shift+ArrowLeft':
                SelAndEntry.changeSelLeftRight(gel, true, true, false);
                break;
            case 'Cmd+ArrowLeft':
                SelAndEntry.changeSelLeftRight(gel, true, false, true);
                break;
            case 'Cmd+Shift+ArrowLeft':
                SelAndEntry.changeSelLeftRight(gel, true, true, true);
                break;
            case 'ArrowRight':
                SelAndEntry.changeSelLeftRight(gel, false, false, false);
                break;
            case 'Shift+ArrowRight':
                SelAndEntry.changeSelLeftRight(gel, false, true, false);
                break;
            case 'Cmd+ArrowRight':
                SelAndEntry.changeSelLeftRight(gel, false, false, true);
                break;
            case 'Cmd+Shift+ArrowRight':
                SelAndEntry.changeSelLeftRight(gel, false, true, true);
                break;
            case 'ArrowUp':
                SelAndEntry.changeSelArrowKeyUpDownVisual(gel, true, false);
                break;
            case 'Shift+ArrowUp':
                SelAndEntry.changeSelArrowKeyUpDownVisual(gel, true, true);
                break;
            case 'Cmd+ArrowUp':
                let arrowbtnup = fldIdToScrollbarPartId(el.id, 'arrowUp');
                this.getScrollbarImpl().onScrollArrowClicked(
                    c,
                    arrowbtnup,
                    -1 * EditTextBehavior.amtScrollArrowClicked
                );
                break;
            case 'ArrowDown':
                SelAndEntry.changeSelArrowKeyUpDownVisual(gel, false, false);
                break;
            case 'Shift+ArrowDown':
                SelAndEntry.changeSelArrowKeyUpDownVisual(gel, false, true);
                break;
            case 'Cmd+ArrowDown':
                let arrowbtndn = fldIdToScrollbarPartId(el.id, 'arrowDn');
                this.getScrollbarImpl().onScrollArrowClicked(c, arrowbtndn, EditTextBehavior.amtScrollArrowClicked);
                break;
            case 'Enter':
                SelAndEntry.changeTextInsert(gel, '\n');
                break;
            case 'NumpadEnter':
                SelAndEntry.changeTextInsert(gel, '\n');
                break;
            case 'Cmd+C':
                // note: at least for now, I am defaulting to a private clipboard that doesn't interact with OS clipboard,
                // for no reason other than to make it "feel" lke a separate emulator that is somehow detached from the normal world
                // user can attach to OS clipboard by setting c.useOSClipboard
                this.sendCutOrCopy(c, el, false);
                break;
            case 'Cmd+X':
                this.sendCutOrCopy(c, el, true);
                break;
            default:
                wasShortcut = false;
                break;
        }

        if (d.readableShortcut === 'Cmd+V' && !c.useOSClipboard) {
            c.clipManager.paste(c.useOSClipboard);
            wasShortcut = true;
        }

        if (wasShortcut) {
            d.setHandled();
        } else if ((d.mods === 0 || d.mods === ModifierKeys.Shift) && d.keyChar.length === 1) {
            let char = d.keyChar;
            let charcode = d.keyChar.charCodeAt(0);
            let toRoman = FormattedText.fromHostCharsetStrict(char, getRoot().getBrowserInfo());
            if (toRoman && toRoman.length === 1 && toRoman.charCodeAt(0) >= 32 && charcode >= 32) {
                if (gel) {
                    // insert the char into the field
                    SelAndEntry.changeTextInsert(gel, toRoman);
                    d.setHandled();
                }
            }
        }
    }

    onPasteText(c: UI512PresenterWithMenuInterface, d: PasteTextEventDetails) {
        let el = SelAndEntry.getSelectedField(c);
        if (el && !(d.fromOS && !c.useOSClipboard)) {
            let text = d.fromOS ? FormattedText.fromExternalCharset(d.text, getRoot().getBrowserInfo()) : d.text;
            let gel = this.gelFromEl(el);
            if (gel) {
                SelAndEntry.changeTextInsert(gel, text);
            }
        }
    }

    sendCutOrCopy(c: UI512PresenterWithMenuInterface, el: UI512ElTextField, isCut: boolean) {
        if (el) {
            let gel = this.gelFromEl(el);
            if (!gel) {
                return;
            }

            if (el.get_b('asteriskonly')) {
                // this is a password "asteriskonly" field so don't allow cut/copy
                return;
            }

            let sel = SelAndEntry.getSelectedText(gel);
            if (sel && sel.length > 0) {
                let text = c.useOSClipboard ? FormattedText.toExternalCharset(sel, getRoot().getBrowserInfo()) : sel;
                let succeeded = c.clipManager.copy(text, c.useOSClipboard);
                if (succeeded && isCut && sel.length > 0) {
                    SelAndEntry.changeTextBackspace(gel, false, false);
                }
            }
        }
    }

    onBlinkCaret(c: UI512PresenterWithMenuInterface, d: IdleEventDetails) {
        c.timerSlowIdle.update(d.milliseconds);
        if (c.timerSlowIdle.isDue()) {
            c.timerSlowIdle.reset();

            // blink the caret for this field
            if (c.getCurrentFocus()) {
                let el = c.app.findElemById(c.getCurrentFocus());
                if (el && el instanceof UI512ElTextField && el.get_b('canselecttext')) {
                    el.set('showcaret', !el.get_b('showcaret'));
                }
            }
        }
    }

    onIdle(c: UI512PresenterWithMenuInterface, d: IdleEventDetails) {
        // scroll down more if user is still clicked on the down arrow
        let clickedid = c.trackClickedIds[0];
        if (c.mouseDragStatus === MouseDragStatus.ScrollArrow && clickedid) {
            let moveAmt = getAmountIfScrollArrowClicked(clickedid);
            if (moveAmt) {
                let el = c.app.findElemById(clickedid);
                if (el && RectUtils.hasPoint(c.trackMouse[0], c.trackMouse[1], el.x, el.y, el.w, el.h)) {
                    this.getScrollbarImpl().onScrollArrowClicked(c, clickedid, moveAmt);
                }
            }
        }

        this.onBlinkCaret(c, d);
        if (c.useOSClipboard) {
            c.clipManager.ensureReadyForPaste(d.milliseconds);
        }
    }
}

export function addDefaultListeners(listeners: { [t: number]: Function[] }) {
    let editTextBehavior = new EditTextBehavior();
    listeners[UI512EventType.MouseDown.valueOf()] = [
        BasicHandlers.trackMouseStatusMouseDown,
        BasicHandlers.trackCurrentElMouseDown,
        BasicHandlers.trackHighlightedButtonMouseDown,
        MenuBehavior.onMouseDown,
        editTextBehavior.onMouseDownScroll.bind(editTextBehavior),
        editTextBehavior.onMouseDownSelect.bind(editTextBehavior),
    ];

    listeners[UI512EventType.MouseUp.valueOf()] = [
        BasicHandlers.trackMouseStatusMouseUp,
        BasicHandlers.trackCurrentElMouseUp,
        BasicHandlers.trackHighlightedButtonMouseUp,
        MenuBehavior.onMouseUp,
        editTextBehavior.onMouseUp.bind(editTextBehavior),
    ];

    listeners[UI512EventType.Idle.valueOf()] = [
        editTextBehavior.onIdle.bind(editTextBehavior),
        BasicHandlers.onIdleRunCallbackQueueFromAsyncs,
    ];
    listeners[UI512EventType.MouseMove.valueOf()] = [
        BasicHandlers.trackCurrentElMouseMove,
        editTextBehavior.onMouseMoveSelect.bind(editTextBehavior),
    ];
    listeners[UI512EventType.MouseEnter.valueOf()] = [
        BasicHandlers.trackHighlightedButtonMouseEnter,
        MenuBehavior.onMouseEnter,
    ];
    listeners[UI512EventType.MouseLeave.valueOf()] = [
        BasicHandlers.trackHighlightedButtonMouseLeave,
        MenuBehavior.onMouseLeave,
    ];
    listeners[UI512EventType.KeyDown.valueOf()] = [
        BasicHandlers.basicKeyShortcuts,
        editTextBehavior.onKeyDown.bind(editTextBehavior),
    ];

    listeners[UI512EventType.KeyUp.valueOf()] = [];
    listeners[UI512EventType.MouseDownDouble.valueOf()] = [
        BasicHandlers.trackMouseDoubleDown,
        editTextBehavior.onMouseDoubleDown.bind(editTextBehavior),
    ];
    listeners[UI512EventType.PasteText.valueOf()] = [editTextBehavior.onPasteText.bind(editTextBehavior)];
}
