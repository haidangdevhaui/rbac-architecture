package com.enterprise.backend.security.context;

/**
 * ThreadLocal holder for the current request's authenticated internal UserContext.
 */
public final class UserContextHolder {

    private static final ThreadLocal<UserContext> CONTEXT = new ThreadLocal<>();

    private UserContextHolder() {
    }

    public static void setContext(UserContext context) {
        CONTEXT.set(context);
    }

    public static UserContext getContext() {
        return CONTEXT.get();
    }

    public static Long getCurrentUserId() {
        UserContext ctx = CONTEXT.get();
        return ctx != null ? ctx.getInternalUserId() : null;
    }

    public static void clear() {
        CONTEXT.remove();
    }
}
