import { atom, useAtom } from "jotai";

export const playingAtom = atom<boolean>(false);

export const usePlaying = () => useAtom(playingAtom);
