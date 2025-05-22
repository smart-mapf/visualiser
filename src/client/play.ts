import { atom, useAtom } from "jotai";

export const autoplayAtom = atom<boolean>(true);
export const useAutoplay = () => useAtom(autoplayAtom);

export const playingAtom = atom<boolean>(false);

export const usePlaying = () => useAtom(playingAtom);

export const speedAtom = atom<number>(1);
export const useSpeed = () => useAtom(speedAtom);
