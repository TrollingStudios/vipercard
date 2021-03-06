
/* auto */ import { O } from '../../ui512/utils/utilsAssert.js';
/* auto */ import { slength } from '../../ui512/utils/utilsUI512.js';
/* auto */ import { RectUtils } from '../../ui512/utils/utilsDraw.js';
/* auto */ import { UI512BeginAsync } from '../../ui512/utils/utilsTestCanvas.js';
/* auto */ import { lng } from '../../ui512/lang/langBase.js';
/* auto */ import { UI512Element } from '../../ui512/elements/ui512ElementsBase.js';
/* auto */ import { UI512Application } from '../../ui512/elements/ui512ElementsApp.js';
/* auto */ import { UI512ElLabel } from '../../ui512/elements/ui512ElementsLabel.js';
/* auto */ import { UI512BtnStyle } from '../../ui512/elements/ui512ElementsButton.js';
/* auto */ import { UI512ElTextField } from '../../ui512/elements/ui512ElementsTextField.js';
/* auto */ import { KeyDownEventDetails } from '../../ui512/menu/ui512Events.js';
/* auto */ import { UI512ElTextFieldAsGeneric } from '../../ui512/textedit/ui512GenericField.js';
/* auto */ import { SelAndEntry } from '../../ui512/textedit/ui512TextSelect.js';
/* auto */ import { UI512ControllerBase } from '../../ui512/presentation/ui512PresenterBase.js';
/* auto */ import { UI512Controller } from '../../ui512/presentation/ui512Presenter.js';
/* auto */ import { VpcSession } from '../../vpc/request/vpcRequest.js';
/* auto */ import { VpcFormNonModalDialogBase } from '../../vpcui/nonmodaldialogs/vpcNonModalCommon.js';
/* auto */ import { IntroPageBase } from '../../vpcui/intro/vpcIntroBase.js';
/* auto */ import { OpenFromLocation, VpcDocLoader } from '../../vpcui/intro/vpcIntroProvider.js';
/* auto */ import { VpcIntroPresenterInterface } from '../../vpcui/intro/vpcIntroInterface.js';

export class IntroOpenPage extends IntroPageBase {
    compositeType = 'IntroOpenPage';
    chooser: O<UI512ElTextField>;
    signInForm: O<VpcFormNonModalDialogBase>;
    newUserForm: O<VpcFormNonModalDialogBase>;
    hardCodedFeatured: [string, string][] = [
        ['demo_graphics.json', 'Interactive art'],
        ['demo_game.json', 'Make a game'],
        ['demo_anim.json', 'Simple animation'],
        ['demo_glider.json', 'GLIDER 4.0'],
        ['demo_spacegame.json', 'Spaceman Gamma'],
    ];
    loadedFromOnline: [string, string][] = [];

    constructor(
        compid: string,
        bounds: number[],
        x: number,
        y: number,
        protected openType: OpenFromLocation
    ) {
        super(compid, bounds, x, y);
    }

    createSpecific(app: UI512Application) {
        let grp = app.getGroup(this.grpid);
        let headerheight = this.drawCommonFirst(app, grp);

        // draw the OK and cancel buttons
        let wndbg = grp.getEl(this.getElId('wndbg'));
        this.drawBtn(app, grp, 1, this.x + 180, this.y + 287, 68, 21);
        this.drawBtn(app, grp, 0, this.x + 180 - (252 - 174), this.y + 287 - 4, 69, 29);

        // draw the logo
        let half = Math.floor(this.logicalWidth / 2);
        let footerheight = 70;
        let yspace = this.logicalHeight - (footerheight + headerheight);
        let aroundLogo = [this.x + half, this.y + headerheight, half, yspace];
        const logomargin = 20;
        let logobounds = RectUtils.getSubRectRaw(
            aroundLogo[0],
            aroundLogo[1],
            aroundLogo[2],
            aroundLogo[3],
            logomargin,
            logomargin
        );
        logobounds = logobounds ? logobounds : [0, 0, 0, 0];
        let logo = this.genBtn(app, grp, 'logo');
        logo.set('style', UI512BtnStyle.Opaque);
        logo.set('autohighlight', false);
        logo.set('icongroupid', 'logo');
        logo.set('iconnumber', 0);
        logo.setDimensions(logobounds[0], logobounds[1], logobounds[2], logobounds[3]);

        // draw the prompt
        let prompt = this.genChild(app, grp, 'prompt', UI512ElLabel);
        let caption = lng('lngFeatured stacks...');
        prompt.set('labeltext', caption);
        prompt.setDimensions(this.x + 20, this.y + 50, 200, 50);

        // draw the list of choices
        let chooserWidth = 218;
        let chooserX = this.x + Math.floor(half - chooserWidth);
        this.chooser = this.genChild(app, grp, 'chooser', UI512ElTextField);
        this.chooser.set('scrollbar', true);
        this.chooser.set('selectbylines', true);
        this.chooser.set('multiline', true);
        this.chooser.set('canselecttext', true);
        this.chooser.set('canedit', false);
        this.chooser.set('labelwrap', false);
        this.chooser.setDimensions(this.x + 26, this.y + 84, 190, 140);
        grp.getEl(this.getElId('footerText')).set('visible', false);

        // let btnOpenFromAccount = this.drawBtn(app, grp, 3, this.x + 311, this.y + 240, 149, 31);
        // btnOpenFromAccount.set('labeltext', lng("lngMy stacks..."))
        // let btnDelete = this.drawBtn(app, grp, 4, btnOpenFromAccount.x, btnOpenFromAccount.bottom + 10, 149, 31);
        // btnDelete.set('labeltext', lng("lngDelete..."))

        if (this.openType === OpenFromLocation.FromStaticDemo) {
            let sDocs: string[] = [];
            sDocs = this.hardCodedFeatured.map(item => item[1]);
            UI512ElTextField.setListChoices(this.chooser, sDocs);

            if (sDocs.length) {
                SelAndEntry.selectLineInField(new UI512ElTextFieldAsGeneric(this.chooser), 0);
            }
        } else {
            prompt.set('labeltext', 'Loading...');
            UI512BeginAsync(() => this.getListChoicesAsync(prompt), undefined, true);
        }

        this.drawCommonLast(app, grp);
    }

    async getListChoicesAsync(prompt: UI512Element) {
        let ses = VpcSession.fromRoot();
        if (!this.chooser) {
            return;
        }
        if (ses) {
            try {
                let stacks = await ses.vpcListMyStacks();
                this.loadedFromOnline = stacks.map(item => [item.fullstackid, item.stackname] as [string, string]);
                UI512ElTextField.setListChoices(this.chooser, this.loadedFromOnline.map(item => item[1]));
                if (this.loadedFromOnline.length) {
                    SelAndEntry.selectLineInField(new UI512ElTextFieldAsGeneric(this.chooser), 0);
                }

                prompt.set('labeltext', 'Open from online stacks:');
            } catch (e) {
                prompt.set('labeltext', e.toString());
            }
        }
    }

    static getChosen(self: IntroOpenPage): O<string> {
        if (self.chooser) {
            let whichLine = SelAndEntry.selectByLinesWhichLine(new UI512ElTextFieldAsGeneric(self.chooser));
            if (whichLine !== undefined) {
                if (self.openType === OpenFromLocation.FromStaticDemo) {
                    let entry = self.hardCodedFeatured[whichLine];
                    if (entry !== undefined) {
                        return entry[0];
                    }
                } else {
                    let entry = self.loadedFromOnline[whichLine];
                    if (entry !== undefined) {
                        return entry[0];
                    }
                }
            }
        }
    }

    static respondBtnClick(c: VpcIntroPresenterInterface, self: IntroOpenPage, el: UI512Element) {
        if (el.id.endsWith('choicebtn0')) {
            let chosenId = IntroOpenPage.getChosen(self);
            if (chosenId && slength(chosenId)) {
                // open the document
                let loader = new VpcDocLoader(chosenId, lng('lngstack'), self.openType);
                c.beginLoadDocument(loader);
            }
        } else if (el.id.endsWith('choicebtn1')) {
            c.goBackToFirstScreen();
        }
    }

    destroy(c: UI512ControllerBase, app: UI512Application) {
        if (this.signInForm) {
            this.signInForm.destroy(c, app);
        }

        super.destroy(c, app);
    }

    deleteSelected(c: VpcIntroPresenterInterface) {
        let whichData = IntroOpenPage.getChosen(this);
        if (true) {
            c.getModal().standardAnswer(
                c,
                c.app,
                'Item removed',
                n => {
                    c.goBackToFirstScreen();
                },
                lng('lngOK')
            );
        }
    }

    respondKeyDown(c: UI512Controller, d: KeyDownEventDetails) {
        /*
        if (d.readableShortcut === 'Delete' || d.readableShortcut === 'Backspace') {
            c.getModal().standardAnswer(c, c.app, 'Confirm deletion?', (n)=>{
                if (n===0) {
                    this.deleteSelected(c)
                }
            }, lng('lngOK'), lng('lngCancel'))
        }*/
    }
}
