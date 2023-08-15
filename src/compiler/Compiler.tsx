/* eslint-disable @typescript-eslint/no-redeclare */
import Evaluator from "./Evaluator";
import Is from "./Is";
import Compute from "./Compute";

import Token, { TokenType } from "./token/Token";
import PowerableToken from "./token/PowerableToken";
import RootToken from "./token/RootToken";
import NumberToken from "./token/NumberToken";
import OperatorToken from "./token/OperatorToken";
import BracketToken from "./token/BracketToken";
import AbsToken from "./token/AbsToken";
import FunctionToken from "./token/FunctionToken";

import { functions, constants } from "../global";
import { Operator, NumberSys } from "../types";
import type { MathFunction } from "../types";
import Utils from "../utils/Utils";

export type NumberSymbol = string;

export default class Compiler {
    private variables: Map<string, NumberSymbol>;
    private isProgrammingMode: boolean;
    private numberSys: NumberSys;

    private raw: string[];

    private layer: number = 0;
    private inAbs: boolean = false;
    private currentFunction: MathFunction | null = null;
    private secondaryRaw: string[] = [];
    private hasError: boolean = false;
    
    public constructor(
        raw: string[],
        variables: Map<string, string>,
        isProgrammingMode: boolean = false,
        numberSys: NumberSys = NumberSys.DEC
    ) {
        this.raw = raw;
        this.variables = variables;
        this.isProgrammingMode = isProgrammingMode;
        this.numberSys = numberSys;
    }

    public tokenize(): RootToken | void {
        var root: RootToken = new RootToken([]);

        var tempParamRaw: NumberSymbol[] = [];
        var tempParamList: Token[] = [];

        const addNumber = (numberStr: string): NumberToken => {
            var value = Utils.strToNum(numberStr, this.numberSys);
            var token = new NumberToken(value, this.numberSys === NumberSys.HEX ? NumberSys.DEC : this.numberSys);
            root.value.push(token);
            
            return token;
        };

        /**
         * Resolve raw input content
         */

        for(let i = 0; i < this.raw.length; i++) {
            var symbol = this.raw[i];
            if(
                this.isProgrammingMode &&
                symbol !== "\\text{not}(" // To avoid "\\text{not}(" being transformed to "not(" and causing error
            ) {
                symbol = Compiler.purifyNumber(symbol);
            }

            /**
             * Layers (inside brackets, absolute value)
             */

            if(this.layer > 0) { // in bracket or function
                if(Is.leftBracket(symbol) || Is.mathFunction(symbol)) this.layer++;
                if(Is.rightBracket(symbol)) this.layer--;

                if(
                    (
                        this.layer >= 1 ||
                        (
                            Is.rightBracket(symbol) &&
                            this.layer === 0
                        )
                    ) &&
                    this.currentFunction
                ) {
                    if(
                        (symbol === "," && this.layer === 1) ||
                        (Is.rightBracket(symbol) && this.layer === 0)
                    ) {
                        var tokenized = new Compiler(tempParamRaw, this.variables, this.isProgrammingMode, this.numberSys).tokenize();
                        if(!tokenized) {
                            this.hasError = true;
                            return;
                        }

                        tempParamList.push(tokenized);
                        tempParamRaw = [];
                    } else {
                        tempParamRaw.push(symbol);
                    }
                    if(!(Is.rightBracket(symbol) && this.layer === 0)) continue;
                }

                if(this.layer > 0) {
                    this.secondaryRaw.push(symbol);
                    continue;
                }
            }

            if(this.inAbs && symbol !== "|") { // in absolute value
                this.secondaryRaw.push(symbol);
                continue;
            }

            /**
             * Main
             */

            if(Is.number(symbol, this.isProgrammingMode) || (Is.variable(symbol) && this.raw[1] !== "=")) { // number
                // Variable and Constant
                if((Is.variable(symbol) || Is.constant(symbol)) && !this.isProgrammingMode) {
                    if(
                        Is.number(this.raw[i - 1], this.isProgrammingMode) ||
                        Is.variable(this.raw[i - 1]) ||
                        Is.constant(this.raw[i - 1]) ||
                        (root.getLength() > 0 && root.getLastChild().type === TokenType.NUMBER) // Process something like `2^2*a`
                    ) { 
                        root.add(new OperatorToken(Operator.MUL, false));

                        symbol = this.variables.get(symbol) ?? (constants.get(symbol) ?? "NaN").toString();
                        addNumber(symbol);

                        // pow
                        const di = this.raw[i + 1] === "!" ? 2 : 1;
                        if(i + di < this.raw.length && this.raw[i + di][0] === "^") {
                            root.getChild<PowerableToken>(root.getLength() - di).exponential = parseInt(this.raw[i + di][1]);
                            i++;
                        }

                        continue;
                    } else {
                        symbol = this.variables.get(symbol) ?? (constants.get(symbol) ?? "NaN").toString();
                    }
                }

                var tempNumber: NumberSymbol = symbol;
                while(Is.number(this.raw[i + 1], this.isProgrammingMode) && !Is.constant(this.raw[i + 1])) {
                    tempNumber += this.raw[i + 1];
                    i++;
                }
                addNumber(tempNumber);
            } else if(Is.operator(symbol)) { // operator
                root.add(new OperatorToken(symbol as Operator, i === 0));
            } else if(Is.leftBracket(symbol)) { // left bracket
                // Process something like `3(5-2)`
                if(i !== 0 && !Is.operator(this.raw[i - 1])) {
                    root.add(new OperatorToken(Operator.MUL, false));
                }
                
                this.layer++;
            } else if(Is.rightBracket(symbol)) { // right bracket
                var secondaryCompiler = new Compiler(this.secondaryRaw, this.variables, this.isProgrammingMode, this.numberSys);
                var bracketContent = secondaryCompiler.tokenize();
                if(!bracketContent) {
                    this.hasError = true;
                    return;
                }

                if(this.currentFunction) {
                    root.add(new FunctionToken(this.currentFunction[0], tempParamList));
                    tempParamRaw = [];
                    tempParamList = [];
                    this.currentFunction = null;
                } else if(this.raw[i + 1] === "!") {
                    root.add(new BracketToken(bracketContent.value, true));
                    i++;
                } else {
                    root.add(new BracketToken(bracketContent.value, false));
                }

                this.secondaryRaw = [];

                // pow (after right bracket or factorial sign)
                // (i + di) is where the "^x" sign is
                const di = this.raw[i + 1] === "!" ? 2 : 1;
                if(i + di < this.raw.length && this.raw[i + di][0] === "^") {
                    root.getChild<PowerableToken>(root.getLength() - di).exponential = parseInt(this.raw[i + di][1]);
                    i++;
                    continue;
                }

                // Process something like `(5-2)3`
                if(
                    i + 1 < this.raw.length &&
                    !Is.operator(this.raw[i + 1]) &&

                    // In the formula like `(5-2)(5-3)` or `sin(2)cos(2)`, the operator
                    // between two items will be handled by the left bracket of `(5-3)`.
                    // So here should do nothing.
                    !Is.leftBracket(this.raw[i + 1]) &&
                    !Is.mathFunction(this.raw[i + 1])
                ) {
                    root.add(new OperatorToken(Operator.MUL, false));
                }
            } else if(symbol === "|") { // absolute value
                if(this.inAbs) {
                    var secondaryCompiler = new Compiler(this.secondaryRaw, this.variables, this.isProgrammingMode, this.numberSys);
                    var absContent = secondaryCompiler.tokenize();
                    if(!absContent) {
                        this.hasError = true;
                        return;
                    }

                    this.raw[i + 1] === "!"
                    ? root.add(new AbsToken(absContent.value, true)) // The factorial will be processed by the Evaluator
                    : root.add(new AbsToken(absContent.value, false));

                    // pow
                    const di = this.raw[i + 1] === "!" ? 2 : 1;
                    if(i + di < this.raw.length && this.raw[i + di][0] === "^") {
                        root.getChild<PowerableToken>(root.getLength() - di).exponential = parseInt(this.raw[i + di][1]);
                        i++;
                    }
                    
                    this.secondaryRaw = [];
                    this.inAbs = false;
                } else {
                    this.inAbs = true;
                }
            } else if(Is.mathFunction(symbol)) { // function
                // Process something like `2sin(pi/6)`
                if(i !== 0 && !Is.operator(this.raw[i - 1])) {
                    root.add(new OperatorToken(Operator.MUL, false));
                }

                var functionName = symbol.replace("\\", "").replace("(", "");
                if(!functions.has(functionName)) {
                    this.hasError = true;
                    return;
                }

                this.currentFunction = functions.get(functionName) ?? [((x) => x), 1];
                this.layer++;
            } else if(symbol[0] === "^") { // pow
                var exponential = parseInt(symbol[1]);

                root.getLastChild<NumberToken>().setValue(Compute.safePow(root.getLastChild().value, exponential));
            } else if(symbol[0] === "!") { // factorial
                var lastToken = root.getLastChild();
                if(!(lastToken instanceof NumberToken)) continue;

                var value = Compute.factorial(lastToken.value);
                lastToken.setValue(value);

                // pow
                if(i + 1 < this.raw.length && this.raw[i + 1][0] === "^") {
                    root.getLastChild<NumberToken>().setValue(Compute.safePow(value, parseInt(this.raw[i + 1][1])));
                    i++;
                    continue;
                }
            }
        }

        if(process.env.NODE_ENV === "test") {
            console.log(
                this.raw.join(""),
                "\n",
                root
            );
        }

        return root;
    }

    public compile(): NumberSymbol {
        var tokenized = this.tokenize();
        
        if(tokenized && !this.hasError) return new Evaluator(tokenized).evaluate().toString();
        return "NaN";
    }

    public static purifyNumber(number: NumberSymbol): NumberSymbol {
        // e.g. "\\text{A}" -> "a"
        return number.replaceAll("\\text{", "").replaceAll("}", "").toLowerCase();
    }
}