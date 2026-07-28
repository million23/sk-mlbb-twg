"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import * as React from "react";

type ResponsiveModalContextValue = {
  isMobile: boolean;
};

const ResponsiveModalContext =
  React.createContext<ResponsiveModalContextValue | null>(null);

function useResponsiveModal() {
  const ctx = React.useContext(ResponsiveModalContext);
  if (!ctx) {
    throw new Error(
      "ResponsiveModal components must be used within <ResponsiveModal>.",
    );
  }
  return ctx;
}

function ResponsiveModal({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const isMobile = useIsMobile();

  return (
    <ResponsiveModalContext.Provider value={{ isMobile }}>
      {isMobile ? (
        <Drawer
          open={open}
          onOpenChange={onOpenChange}
          swipeDirection="down"
          showSwipeHandle
        >
          {children}
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          {children}
        </Dialog>
      )}
    </ResponsiveModalContext.Provider>
  );
}

function ResponsiveModalContent({
  className,
  children,
  showCloseButton,
  ...props
}: React.ComponentProps<typeof DialogContent>) {
  const { isMobile } = useResponsiveModal();

  if (isMobile) {
    return (
      <DrawerContent
        className={cn(
          // Defaults (callers may override padding via p-0).
          "flex flex-col overflow-hidden p-4 max-h-[92svh] [--drawer-content-height:auto]",
          className,
          // Locked mobile sheet geometry — must win over dialog max-w-* classes.
          "inset-x-0 bottom-0 w-full max-w-none! rounded-none! rounded-t-2xl! border-x-0! border-b-0! [--drawer-content-width:100%] [--drawer-inset:0px]",
        )}
        {...props}
      >
        {children}
      </DrawerContent>
    );
  }

  return (
    <DialogContent
      className={className}
      showCloseButton={showCloseButton}
      {...props}
    >
      {children}
    </DialogContent>
  );
}

function ResponsiveModalHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { isMobile } = useResponsiveModal();

  if (isMobile) {
    return (
      <DrawerHeader
        className={cn(
          "shrink-0 gap-1 px-0 pt-1 pb-3 text-left group-data-[swipe-axis=y]/drawer-popup:text-left",
          className,
        )}
        {...props}
      />
    );
  }

  return <DialogHeader className={className} {...props} />;
}

function ResponsiveModalFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { isMobile } = useResponsiveModal();

  if (isMobile) {
    return (
      <DrawerFooter
        className={cn(
          "shrink-0 gap-2 px-0 pt-3 pb-[max(0.25rem,env(safe-area-inset-bottom))]",
          className,
        )}
        {...props}
      />
    );
  }

  return <DialogFooter className={className} {...props} />;
}

function ResponsiveModalTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogTitle>) {
  const { isMobile } = useResponsiveModal();

  if (isMobile) {
    return (
      <DrawerTitle
        className={cn("font-serif text-xl tracking-tight", className)}
        {...props}
      />
    );
  }

  return <DialogTitle className={className} {...props} />;
}

function ResponsiveModalDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogDescription>) {
  const { isMobile } = useResponsiveModal();

  if (isMobile) {
    return (
      <DrawerDescription className={cn("text-left", className)} {...props} />
    );
  }

  return <DialogDescription className={className} {...props} />;
}

export {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
};
