
/* auto */ import { vpcversion } from '../../appsettings.js';
/* auto */ import { assertTrueWarn, cProductName, checkThrow } from '../../ui512/utils/utilsAssert.js';
/* auto */ import { Util512, checkThrowEq, getEnumToStrOrUnknown, getStrToEnum } from '../../ui512/utils/utilsUI512.js';
/* auto */ import { UI512CursorAccess, UI512Cursors } from '../../ui512/utils/utilsCursors.js';
/* auto */ import { ChangeContext } from '../../ui512/draw/ui512interfaces.js';
/* auto */ import { UI512Patterns } from '../../ui512/draw/ui512drawpattern.js';
/* auto */ import { VpcElType, VpcTool } from '../../vpc/vpcutils/vpcenums.js';
/* auto */ import { PropGetter, PropSetter, PrpTyp, VpcElBase } from '../../vpc/vel/velbase.js';
/* auto */ import { VpcElField } from '../../vpc/vel/velfield.js';
/* auto */ import { VpcElButton } from '../../vpc/vel/velbutton.js';
/* auto */ import { VpcElCard } from '../../vpc/vel/velcard.js';
/* auto */ import { VpcElBg } from '../../vpc/vel/velbg.js';
/* auto */ import { VpcElStack } from '../../vpc/vel/velstack.js';

export class VpcElProductOpts extends VpcElBase {
    // unlike other elements, nothing here is persisted during save.
    isVpcElProduct = true;
    protected _itemDel = ',';
    protected _script = '';
    protected _name = `${cProductName}`;
    protected _longname = `Applications:${cProductName} Folder:${cProductName}`;

    // settings that shouldn't be touched directly
    protected _currentTool = VpcTool.pencil;
    allowSetCurrentTool = false;

    // settings stored here to get an undoable setting
    protected _currentCardId = '';
    protected _optWideLines = false;
    protected _optPaintDrawMult = false;
    protected _currentPattern = UI512Patterns.defaultPattern;
    protected _optPaintLineColor = UI512Patterns.defaultLineColor;
    protected _optPaintFillColor = UI512Patterns.defaultFillColor;
    protected _optUseHostClipboard = true;
    protected _viewingScriptVelId = '';
    protected _selectedVelId = '';
    protected _suggestedIdleRate = '';

    getAttributesList() {
        // none of these attributes are persisted
        return [];
    }

    getType() {
        return VpcElType.Product;
    }

    constructor(id: string, parentid: string) {
        super(id, parentid);
    }

    set<T>(s: string, newval: T, context = ChangeContext.Default) {
        assertTrueWarn(s !== 'currentTool' || this.allowSetCurrentTool, '');
        return super.set(s, newval, context);
    }

    startGettersSetters() {
        VpcElProductOpts.prodInit();
        this.getters = VpcElProductOpts.cachedGetters;
        this.setters = VpcElProductOpts.cachedSetters;
    }

    static prodGetters(getters: { [key: string]: PropGetter<VpcElBase> }) {
        // hard-coded responses to properties
        getters['environment'] = [PrpTyp.str, () => 'development'];
        getters['freesize'] = [PrpTyp.num, () => 0];
        getters['size'] = [PrpTyp.num, () => 0];
        getters['stacksinuse'] = [PrpTyp.str, () => ''];
        getters['suspended'] = [PrpTyp.bool, () => false];
        getters['version/long'] = [PrpTyp.str, () => vpcversion];
        getters['version'] = [PrpTyp.str, () => vpcversion[0] + '.' + vpcversion[1]];

        getters['itemdelimiter'] = [PrpTyp.str, 'itemDel'];
        getters['cursor'] = [
            PrpTyp.str,
            (me: VpcElProductOpts) => {
                let curs = UI512CursorAccess.getCursor();
                return getEnumToStrOrUnknown<UI512Cursors>(UI512Cursors, curs);
            },
        ];
    }

    static prodSetters(setters: { [key: string]: PropSetter<VpcElBase> }) {
        setters['itemdelimiter'] = [
            PrpTyp.str,
            (me: VpcElProductOpts, s: string) => {
                checkThrowEq(1, s.length, `7C|length of itemdel must be 1`);
                me.set('itemDel', s);
            },
        ];

        setters['cursor'] = [
            PrpTyp.str,
            (me: VpcElProductOpts, s: string) => {
                if (s === '1') {
                    s = 'beam';
                } else if (s === '2') {
                    s = 'cross';
                } else if (s === '3') {
                    s = 'plus';
                } else if (s === '4') {
                    s = 'watch';
                }

                let n = getStrToEnum<UI512Cursors>(UI512Cursors, `cursor ${s} not supported`, s);
                UI512CursorAccess.setCursor(n);
            },
        ];

        setters['idlerate'] = [
            PrpTyp.str,
            (me: VpcElProductOpts, s: string) => {
                if (s === 'faster') {
                    me.set('suggestedIdleRate', 'faster');
                } else if (!s || s === 'default') {
                    me.set('suggestedIdleRate', 'default');
                } else {
                    checkThrow(false, `unsupported idlerate, try "faster" or "default"`);
                }
            },
        ];
    }

    static cachedGetters: { [key: string]: PropGetter<VpcElBase> };
    static cachedSetters: { [key: string]: PropSetter<VpcElBase> };
    static prodInit() {
        if (!VpcElProductOpts.cachedGetters || !VpcElProductOpts.cachedSetters) {
            VpcElProductOpts.cachedGetters = {};
            VpcElProductOpts.prodGetters(VpcElProductOpts.cachedGetters);
            VpcElProductOpts.cachedSetters = {};
            VpcElProductOpts.prodSetters(VpcElProductOpts.cachedSetters);
            Util512.freezeRecurse(VpcElProductOpts.cachedGetters);
            Util512.freezeRecurse(VpcElProductOpts.cachedSetters);
        }
    }

    static canGetProductProp(propName: string) {
        VpcElProductOpts.prodInit();
        return !!VpcElProductOpts.cachedGetters[propName] || !!VpcElProductOpts.cachedSetters[propName];
    }

    static isAnyProp(propName: string) {
        VpcElButton.btnInit();
        VpcElField.fldInit();
        VpcElCard.cdInit();
        VpcElBg.bgInit();
        VpcElStack.stackInit();
        VpcElProductOpts.prodInit();
        return (
            !!VpcElButton.cachedGetters[propName] ||
            !!VpcElButton.cachedSetters[propName] ||
            !!VpcElField.cachedGetters[propName] ||
            !!VpcElField.cachedSetters[propName] ||
            !!VpcElCard.cachedGetters[propName] ||
            !!VpcElCard.cachedSetters[propName] ||
            !!VpcElBg.cachedGetters[propName] ||
            !!VpcElBg.cachedSetters[propName] ||
            !!VpcElStack.cachedGetters[propName] ||
            !!VpcElStack.cachedSetters[propName] ||
            !!VpcElProductOpts.cachedGetters[propName] ||
            !!VpcElProductOpts.cachedSetters[propName]
        );
    }
}