import { atom, useAtom } from "jotai";
import { useCallback } from "react";

export const selectionAtom = atom<Set<number>>(new Set<number>());

export function useSelection(): [Set<number>, (id: number) => void] {
    const [selection, setSelection] = useAtom(selectionAtom);
    const toggle = useCallback((id: number) => setSelection((s) => {
        const newSet = new Set(s);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        return newSet;
    }), [setSelection])
    return [selection, toggle];
}
