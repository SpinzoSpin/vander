"use client";

import React, { ElementType, ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface ScrollRevealProps {
  children: ReactNode;
  variant?: "fade" | "slide-up" | "slide-down" | "slide-left" | "slide-right" | "scale-up" | "scale-down";
  duration?: number; // in milliseconds
  delay?: number; // in milliseconds
  threshold?: number;
  distance?: string; // transition offset distance e.g. "20px"
  rootMargin?: string;
  once?: boolean;
  className?: string;
  as?: ElementType;
}

export function ScrollReveal({
  children,
  variant = "slide-up",
  duration = 600,
  delay = 0,
  threshold = 0.1,
  distance = "24px",
  rootMargin = "0px 0px -50px 0px",
  once = true,
  className,
  as: Component = "div",
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.unobserve(element);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [threshold, rootMargin, once]);

  // Determine transition styles based on visibility and props
  const getVariantStyles = () => {
    if (isVisible) {
      return {
        opacity: 1,
        transform: "translate(0, 0) scale(1)",
      };
    }

    switch (variant) {
      case "fade":
        return {
          opacity: 0,
          transform: "none",
        };
      case "slide-up":
        return {
          opacity: 0,
          transform: `translateY(${distance})`,
        };
      case "slide-down":
        return {
          opacity: 0,
          transform: `translateY(-${distance})`,
        };
      case "slide-left":
        return {
          opacity: 0,
          transform: `translateX(${distance})`,
        };
      case "slide-right":
        return {
          opacity: 0,
          transform: `translateX(-${distance})`,
        };
      case "scale-up":
        return {
          opacity: 0,
          transform: "scale(0.95)",
        };
      case "scale-down":
        return {
          opacity: 0,
          transform: "scale(1.05)",
        };
      default:
        return {
          opacity: 0,
          transform: `translateY(${distance})`,
        };
    }
  };

  const styles = {
    ...getVariantStyles(),
    transitionProperty: "opacity, transform",
    transitionDuration: `${duration}ms`,
    transitionDelay: `${delay}ms`,
    transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)", // Sleek easeOutExpo curve for premium feel
    willChange: "opacity, transform",
  };

  return (
    <Component
      ref={elementRef}
      style={styles}
      className={cn("origin-center", className)}
    >
      {children}
    </Component>
  );
}

export interface ScrollRevealGroupProps {
  children: ReactNode;
  stagger?: number; // delay increment in milliseconds
  delay?: number; // base delay for the group in milliseconds
  variant?: "fade" | "slide-up" | "slide-down" | "slide-left" | "slide-right" | "scale-up" | "scale-down";
  duration?: number;
  threshold?: number;
  distance?: string;
  rootMargin?: string;
  once?: boolean;
}

export function ScrollRevealGroup({
  children,
  stagger = 100,
  delay = 0,
  variant,
  duration,
  threshold,
  distance,
  rootMargin,
  once,
}: ScrollRevealGroupProps) {
  return (
    <>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        
        const element = child as React.ReactElement<{ delay?: number }>;
        // Pass animated props down to ScrollReveal children dynamically
        const extraProps: Record<string, any> = {
          delay: (element.props.delay ?? 0) + delay + index * stagger,
        };
        
        if (variant !== undefined) extraProps.variant = variant;
        if (duration !== undefined) extraProps.duration = duration;
        if (threshold !== undefined) extraProps.threshold = threshold;
        if (distance !== undefined) extraProps.distance = distance;
        if (rootMargin !== undefined) extraProps.rootMargin = rootMargin;
        if (once !== undefined) extraProps.once = once;

        return React.cloneElement(child as React.ReactElement<any>, extraProps);
      })}
    </>
  );
}

