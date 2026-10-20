import type { HTMLMotionProps } from "framer-motion";

/* ----------------------------------------------------------
   iMessage-style bubble motion
   A sent bubble springs up out of the composer corner (scales
   from its bottom-right); a received bubble pops in from its
   bottom-left. Wrap the list in <AnimatePresence initial={false}>
   so bubbles already in the thread render in place and only new
   ones animate.
   ---------------------------------------------------------- */

const SPRING = { type: "spring", stiffness: 520, damping: 34, mass: 0.9 } as const;

export function bubbleMotion(isMine: boolean): Pick<HTMLMotionProps<"div">, "initial" | "animate" | "exit" | "transition" | "style"> {
    return {
        initial: isMine
            ? { opacity: 0, scale: 0.55, y: 28, x: 6 }
            : { opacity: 0, scale: 0.7, y: 14, x: -6 },
        animate: { opacity: 1, scale: 1, y: 0, x: 0 },
        exit: { opacity: 0, scale: 0.9, transition: { duration: 0.12 } },
        transition: { ...SPRING, opacity: { duration: 0.16 } },
        style: { transformOrigin: isMine ? "100% 100%" : "0% 100%" },
    };
}
