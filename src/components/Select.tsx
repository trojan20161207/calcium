/* eslint-disable react-hooks/exhaustive-deps */
import React, {
    useState,
    useEffect,
    useRef,
    useContext,
    useMemo,
    useId
} from "react";
import { ReactSVG } from "react-svg";

import type { PropsWithChildren } from "@/types";
import Emitter from "@/utils/Emitter";

import useEmitter from "@/hooks/useEmitter";

import SelectContext from "@/contexts/SelectContext";

import expandIcon from "@/icons/expand.svg";

interface SelectItemProps extends PropsWithChildren {
    id: string
}

interface SelectProps {
    children: JSX.Element[]
    defaultValue: string // id
    width?: number
    iconPosition?: "left" | "right"
    onSelect?: (itemId: string) => void
}

export const SelectItem: React.FC<SelectItemProps> = (props) => {
    const { id, ...data } = props;
    const { selectorId, selectorValue } = useContext(SelectContext);

    const handleSelect = () => {
        new Emitter().emit("selector-select", selectorId, id);
    };

    return (
        <div
            className={"select-item"+ (selectorValue === id ? " selected" : "")}
            id={"select-item--"+ id}
            onClick={() => handleSelect()}
            {...data}>
            {props.children}
        </div>
    );
}

export const Select: React.FC<SelectProps> = (props) => {
    const list = useMemo(() => props.children.map((item) => (item.props.id ?? "")), [props.children]);
    const [active, setActive] = useState<boolean>(false);
    const [value, setValue] = useState<string>(props.defaultValue);
    const idRef = useRef(useId());
    const elemRef = useRef<HTMLDivElement | null>(null);

    function getIndexByValue(value: string): number {
        for(let i = 0; i < list.length; i++) {
            if(list[i] === value) {
                return i;
            }
        }
        return -1;
    }

    const handleClick = () => {
        setActive(!active);
    };

    useEffect(() => {
        window.addEventListener("mousedown", (e) => {
            const target = e.target as HTMLElement;
            if(!elemRef.current?.contains(target)) {
                setActive(false);
            }
        });
    }, []);

    useEmitter([
        ["selector-select", async (selectorId, itemId) => {
            if(selectorId !== idRef.current) return;
            if(!list.includes(itemId)) return;

            setValue(itemId);
            setActive(false);
            props.onSelect && props.onSelect(itemId);
        }]
    ]);

    return (
        <SelectContext.Provider value={{ selectorId: idRef.current, selectorValue: value }}>
            <div className={"select"+ (active ? " active" : "")} id={"select--"+ useId()} ref={elemRef}>
                <div className="select-button" style={{ width: props.width ? (props.width +"px") : "100%" }}>
                    <button onClick={() => handleClick()} style={{ flexDirection: !props.iconPosition || props.iconPosition === "right" ? "row" : "row-reverse" }}>
                        {props.children[getIndexByValue(value)]}
                        <div className="select-icon">
                            <ReactSVG src={expandIcon}/>
                        </div>
                    </button>
                </div>
                <div className="select-panel-wrapper">
                    <div className="select-panel">
                        {props.children}
                    </div>
                </div>
            </div>
        </SelectContext.Provider>
    );
}
