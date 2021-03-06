
/* auto */ import { checkThrow, makeVpcInternalErr, makeVpcScriptErr } from '../../ui512/utils/utilsAssert.js';
/* auto */ import { MapKeyToObject, checkThrowEq } from '../../ui512/utils/utilsUI512.js';
/* auto */ import { CountNumericId } from '../../vpc/vpcutils/vpcUtils.js';
/* auto */ import { VpcLineCategory } from '../../vpc/codepreparse/vpcPreparseCommon.js';
/* auto */ import { VpcCodeLine, VpcCodeLineReference } from '../../vpc/codepreparse/vpcCodeLine.js';

// remember the entrance/exit points of a block.
// we'll use this to set the blockInformation for these lines,
// so that e.g. a loop knows which offset to go back up to.
class BranchTrackingBlock {
    constructor(public readonly cat: VpcLineCategory, firstline?: VpcCodeLine) {
        if (firstline) {
            this.add(firstline);
        }
    }

    add(line: VpcCodeLine) {
        this.relevantLines.push(line);
    }

    relevantLines: VpcCodeLine[] = [];
}

// create a BranchTrackingBlock for each block,
// also makes sure the opening/closing of a block is correct.
export class BranchTracking {
    handlers = new MapKeyToObject<VpcCodeLineReference>();
    stackBlocks: BranchTrackingBlock[] = [];

    constructor(protected idgen: CountNumericId) {}

    findCurrentLoop() {
        for (let i = this.stackBlocks.length - 1; i >= 0; i--) {
            if (this.stackBlocks[i].cat === VpcLineCategory.RepeatForever) {
                return this.stackBlocks[i];
            }
        }

        throw makeVpcScriptErr(`5r|cannot call 'exit repeat' or 'next repeat' outside of a loop`);
    }

    findCurrentHandler(): BranchTrackingBlock {
        checkThrowEq(VpcLineCategory.HandlerStart, this.stackBlocks[0].cat, `7>|could not find current handler`);
        return this.stackBlocks[0];
    }

    finalizeBlock() {
        let topOfStack = this.stackBlocks[this.stackBlocks.length - 1];
        let references = topOfStack.relevantLines.map(ln => new VpcCodeLineReference(ln));
        for (let line of topOfStack.relevantLines) {
            line.blockInfo = references;
        }

        this.stackBlocks.pop();
    }

    ensureComplete() {
        checkThrowEq(0, this.stackBlocks.length, `7=|missing 'end myHandler' at end of script.`);
    }

    go(line: VpcCodeLine) {
        if (this.stackBlocks.length === 0 && line.ctg !== VpcLineCategory.HandlerStart) {
            throw makeVpcScriptErr(`5q|only 'on mouseup' and 'function myfunction' can exist at this scope`);
        } else if (this.stackBlocks.length > 0 && line.ctg === VpcLineCategory.HandlerStart) {
            throw makeVpcScriptErr(`5p|cannot begin a handler inside an existing handler`);
        }

        switch (line.ctg) {
            case VpcLineCategory.RepeatForever: // fall-through
            case VpcLineCategory.RepeatWhile: // fall-through
            case VpcLineCategory.RepeatUntil:
                this.stackBlocks.push(new BranchTrackingBlock(VpcLineCategory.RepeatForever, line));
                break;
            case VpcLineCategory.RepeatNext: // fall-through
            case VpcLineCategory.RepeatExit:
                let tracking = this.findCurrentLoop();
                tracking.add(line);
                break;
            case VpcLineCategory.RepeatEnd:
                let topOfStack = this.stackBlocks[this.stackBlocks.length - 1];
                checkThrowEq(
                    VpcLineCategory.RepeatForever,
                    topOfStack.cat,
                    `7<|cannot "end repeat" interleaved within some other block.`
                );
                topOfStack.add(line);
                this.finalizeBlock();
                break;
            case VpcLineCategory.IfStart:
                this.stackBlocks.push(new BranchTrackingBlock(VpcLineCategory.IfStart, line));
                break;
            case VpcLineCategory.IfElse: // fall-through
            case VpcLineCategory.IfElsePlain:
                topOfStack = this.stackBlocks[this.stackBlocks.length - 1];
                checkThrowEq(
                    VpcLineCategory.IfStart,
                    topOfStack.cat,
                    `7;|cannot have an "else" interleaved within some other block.`
                );
                topOfStack.add(line);
                break;
            case VpcLineCategory.IfEnd:
                topOfStack = this.stackBlocks[this.stackBlocks.length - 1];
                checkThrowEq(
                    VpcLineCategory.IfStart,
                    topOfStack.cat,
                    `7:|cannot have an "end if" interleaved within some other block.`
                );
                topOfStack.add(line);
                this.finalizeBlock();
                break;
            case VpcLineCategory.HandlerStart:
                this.stackBlocks.push(new BranchTrackingBlock(VpcLineCategory.HandlerStart, line));
                break;
            case VpcLineCategory.HandlerEnd:
                topOfStack = this.stackBlocks[this.stackBlocks.length - 1];
                checkThrowEq(
                    VpcLineCategory.HandlerStart,
                    topOfStack.cat,
                    `7/|cannot have an "end myHandler" interleaved within some other block.`
                );
                topOfStack.add(line);
                this.checkStartAndEndMatch(topOfStack.relevantLines);
                let firstname = topOfStack.relevantLines[0].excerptToParse[1].image;

                // call add() so that we'll throw if there is a duplicate
                this.handlers.add(firstname, new VpcCodeLineReference(topOfStack.relevantLines[0]));
                this.finalizeBlock();
                break;
            case VpcLineCategory.HandlerExit: // fall-through
            case VpcLineCategory.HandlerPass:
                // if we're in "on mouseup", it's illegal to say "exit otherHandler"
                let currentHandlerStart = this.findCurrentHandler().relevantLines[0];
                checkThrow(currentHandlerStart.excerptToParse.length > 1, '7.|expected on myHandler, not found');
                let currentHandlerName = currentHandlerStart.excerptToParse[1].image;
                let gotName = line.excerptToParse[1].image;
                checkThrowEq(
                    gotName,
                    currentHandlerName,
                    '7-|we are in handler but got exit otherHandler',
                    currentHandlerName,
                    gotName
                );
                break;
            case VpcLineCategory.Invalid:
                throw makeVpcInternalErr('5o|should not have this line category');
            default:
                break;
        }
    }

    checkStartAndEndMatch(lines: VpcCodeLine[]) {
        checkThrow(lines[0].excerptToParse.length > 1, '7,|on myHandler, missing name of handler');
        let firstname = lines[0].excerptToParse[1].image;
        let lastline = lines[lines.length - 1];
        checkThrow(lastline.excerptToParse.length > 1, '7+|end myHandler, missing name of handler');
        let lastname = lastline.excerptToParse[1].image;
        checkThrowEq(
            lastname,
            firstname,
            `7*|handler names mismatch. start with with "on ${firstname}" ended with "end ${lastname}"`
        );
    }
}
