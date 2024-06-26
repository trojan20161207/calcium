import React, { ReactElement } from "react";

export type StateSetter<S> = React.Dispatch<React.SetStateAction<S>>;

export interface ReducerAction<T, P> {
    type: T
    payload: P
}

export enum Mode {
    GENERAL = "general",
    GRAPHING = "graphing",
    PROGRAMMING = "programming"
}

export enum Theme {
    LIGHT = "light",
    DARK = "dark"
}

export enum NumberSys {
    HEX = "hex",
    DEC = "dec",
    OCT = "oct",
    BIN = "bin"
}

export enum Operator {
    ADD = "+",
    SUB = "-",
    MUL = "×",
    DIV = "/",
    AND = "and",
    OR = "or",
    NAND = "nand",
    NOR = "nor",
    XOR = "xor",
    LSH = "lsh",
    RSH = "rsh",
}

export enum InputTag {
    COMMON = "common",
    VAR = "var",
    CONST = "const",
    FUNC = "func",
}

export type FunctionInfo = [(...params: number[]) => number, number /* amount of params */];

export interface RenderedFunction {
    id: number
    value: string
    mode: FunctionInputtingType
}

export type WorkerResponse = {
    imageBitmap: ImageBitmap
}

export interface PromiseExecutor {
    resolve: (value: WorkerResponse) => void
    reject: (reason?: any) => void
}

export interface WorkerInfo extends PromiseExecutor {
    workData: any
}

export interface PropsWithRef<T> {
    ref: React.Ref<T>
}

export interface PropsWithChildren {
    children?: ReactElement | ReactElement[] | undefined
}

export interface Shortcut {
    description: string
    action: () => void
}

export enum MovingDirection {
    LEFT, RIGHT
}

export enum ZoomDirection {
    ZOOM_IN, ZOOM_OUT
}

export enum RecordType {
    GENERAL, PROGRAMMING
}

export enum RollbackToward {
    PREV = -1, NEXT = 1
}

export enum FunctionInputtingType {
    NORMAL = "normal", POLAR = "polar"
}
