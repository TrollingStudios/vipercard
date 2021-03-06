
/* auto */ import { O, assertTrue, assertTrueWarn, respondUI512Error } from '../../ui512/utils/utilsAssert.js';
/* auto */ import { BrowserOSInfo, RenderComplete, RepeatingTimer, Root, UI512IsEventInterface, UI512IsSessionInterface, Util512 } from '../../ui512/utils/utilsUI512.js';
/* auto */ import { UI512CursorAccess } from '../../ui512/utils/utilsCursors.js';
/* auto */ import { ModifierKeys } from '../../ui512/utils/utilsDrawConstants.js';
/* auto */ import { CanvasWrapper } from '../../ui512/utils/utilsDraw.js';
/* auto */ import { UI512DrawText } from '../../ui512/draw/ui512DrawText.js';
/* auto */ import { UI512IconManager } from '../../ui512/draw/ui512DrawIcon.js';
/* auto */ import { EventDetails, IdleEventDetails, MouseDownDoubleEventDetails, MouseDownEventDetails, MouseEventDetails, MouseMoveEventDetails, MouseUpEventDetails } from '../../ui512/menu/ui512Events.js';
/* auto */ import { UI512Controller } from '../../ui512/presentation/ui512Presenter.js';
/* auto */ import { VpcInitIcons } from '../../vpc/vpcutils/vpcInitIcons.js';
/* auto */ import { VpcUiIntro } from '../../vpcui/intro/vpcIntro.js';
/* auto */ import { UI512DemoBasic } from '../../test/ui512/uiDemoBasic.js';
/* auto */ import { UI512DemoText } from '../../test/ui512/uiDemoText.js';
/* auto */ import { UI512DemoPaint } from '../../test/ui512/uiDemoPaint.js';
/* auto */ import { UI512DemoButtons } from '../../test/ui512/uiDemoButtons.js';
/* auto */ import { UI512DemoMenus } from '../../test/ui512/uiDemoMenus.js';
/* auto */ import { UI512DemoTextEdit } from '../../test/ui512/uiDemoTextEdit.js';
/* auto */ import { UI512DemoComposites } from '../../test/ui512/uiDemoComposites.js';
/* auto */ import { runTestsImpl } from '../../test/vpcui/testRegistration.js';

export class UI512FullRoot implements Root {
    domCanvas: CanvasWrapper;
    controller: UI512Controller;
    fontManager: UI512DrawText;
    iconManager: UI512IconManager;
    browserOSInfo: BrowserOSInfo;
    prevMouseDown: O<MouseDownEventDetails>;
    scaleMouseCoords: O<number>;
    session: O<UI512IsSessionInterface>;

    /* send a ping to the apps every 0.1 seconds */
    timerSendIdleEvent = new RepeatingTimer(100);
    mouseButtonsExpected = 0;

    init(domCanvas: HTMLCanvasElement) {
        this.browserOSInfo = Util512.getBrowserOS(window.navigator.userAgent);
        this.fontManager = new UI512DrawText();
        this.iconManager = new UI512IconManager();
        this.domCanvas = new CanvasWrapper(domCanvas);

        /* this.controller = new UI512DemoBasic(); */
        /* this.controller = new UI512DemoButtons(); */
        /* this.controller = new UI512DemoComposites(); */
        /* this.controller = new UI512DemoMenus(); */
        /* this.controller = new UI512DemoPaint(); */
        /* this.controller = new UI512DemoText(); */
        /* this.controller = new UI512DemoTextEdit(); */
        this.controller = new VpcUiIntro();
        domCanvas.setAttribute('id', 'mainDomCanvas');
        UI512CursorAccess.setCursor(UI512CursorAccess.defaultCursor);

        VpcInitIcons.go();

        try {
            this.controller.init();
        } catch (e) {
            respondUI512Error(e, 'init');
        }
    }

    public invalidateAll() {
        try {
            this.controller.invalidateAll();
        } catch (e) {
            respondUI512Error(e, 'invalidateAll');
        }
    }

    public getDrawText() {
        return this.fontManager;
    }

    public getDrawIcon() {
        return this.iconManager;
    }

    public getSession() {
        return this.session;
    }

    public setSession(ss: O<UI512IsSessionInterface>) {
        this.session = ss;
    }

    public getBrowserInfo() {
        return this.browserOSInfo;
    }

    replaceCurrentPresenter(newController: any) {
        assertTrue(newController && newController instanceof UI512Controller, '3@|not a controller');
        if (newController.importMouseTracking) {
            newController.importMouseTracking(this.controller);
        }

        this.controller = newController;
        this.invalidateAll();
    }

    sendEvent(evt: UI512IsEventInterface) {
        let details = evt as EventDetails
        assertTrueWarn(details.isEventDetails, "")
        return this.event(details)
    }

    event(details: EventDetails) {
        if (details instanceof MouseEventDetails) {
            if (!this.scaleMouseCoords) {
                return false;
            }

            details.mouseX = Math.trunc(details.mouseX / this.scaleMouseCoords);
            details.mouseY = Math.trunc(details.mouseY / this.scaleMouseCoords);
        }

        if (details instanceof MouseMoveEventDetails) {
            if (!this.scaleMouseCoords) {
                return false;
            }

            details.mouseX = Math.trunc(details.mouseX / this.scaleMouseCoords);
            details.mouseY = Math.trunc(details.mouseY / this.scaleMouseCoords);
            details.prevMouseX = Math.trunc(details.prevMouseX / this.scaleMouseCoords);
            details.prevMouseY = Math.trunc(details.prevMouseY / this.scaleMouseCoords);
        }

        if (!details.handled()) {
            try {
                this.controller.rawEvent(details);
            } catch (e) {
                respondUI512Error(e, 'event ' + details.type());
            }
        }

        if (details instanceof MouseDownEventDetails) {
            if (this.prevMouseDown) {
                if (
                    details.timestamp - this.prevMouseDown.timestamp < 500 &&
                    Math.abs(details.mouseX - this.prevMouseDown.mouseX) < 2 &&
                    Math.abs(details.mouseY - this.prevMouseDown.mouseY) < 2 &&
                    details.button === this.prevMouseDown.button
                ) {
                    let newevent = new MouseDownDoubleEventDetails(
                        details.timestamp,
                        details.mouseX,
                        details.mouseY,
                        details.button,
                        details.mods
                    );

                    /* don't set d.el yet, this.prevMouseDown.el might be out of date. */
                    this.event(newevent);
                }
            }

            this.prevMouseDown = details;
        }

        return details.handled();
    }

    rawResize(width: number, height: number) {
        this.invalidateAll();
    }

    sendMissedEvents(buttons: number) {
        /* observed behavior: let's say there is a button on the screen. you click the button, */
        /* and it highlights as expected. you then, while holding the mouse button down, drag the */
        /* cursor outside of the window. then release the mouse button when the cursor is outside. */
        /* now, when you bring the cursor back into the window, it *incorrectly* thinks that */
        /* the button should be re-highlighted, even though the mouse button is up, because */
        /* we never got the mouseup event. */

        /* so, I wrote this fix. if we see that the mouse buttons are different than we */
        /* expected, send simulated "mouseup" events for each mouse button that is now up. */
        /* (the same could be done for mousedown events, but we don't have any drag-into-window scenario now). */
        const maxNumberOfMouseButtons = 10;
        let needToSendMouseUp = this.mouseButtonsExpected & ~buttons;
        this.mouseButtonsExpected = buttons;
        for (let i = 0; i < maxNumberOfMouseButtons; i++) {
            if (needToSendMouseUp & (1 << i)) {
                let details = new MouseUpEventDetails(0, 0, 0, i, ModifierKeys.None);
                this.event(details);
            }
        }
    }

    drawFrame(frameCount: number, milliseconds: number) {
        this.timerSendIdleEvent.update(milliseconds);
        if (this.timerSendIdleEvent.isDue()) {
            this.timerSendIdleEvent.reset();
            this.event(new IdleEventDetails(milliseconds));
        }

        let complete = new RenderComplete();
        try {
            this.controller.render(this.domCanvas, milliseconds, complete);
        } catch (e) {
            respondUI512Error(e, 'drawFrame');
        }
    }

    public runTests(all: boolean) {
        runTestsImpl(all);
    }
}
