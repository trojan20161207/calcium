export enum TokenType {
    ROOT, NUMBER, OPERATOR, BRACKET, ABS, FUNCTION
}

export default abstract class Token<T = any> {
    public abstract readonly type: TokenType;
    public value: T;

    public constructor(value: T) {
        this.value = value;
    }
}