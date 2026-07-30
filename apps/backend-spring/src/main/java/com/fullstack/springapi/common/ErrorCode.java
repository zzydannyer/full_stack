package com.fullstack.springapi.common;

public enum ErrorCode {
    INVALID_PARAMETER(10001, "invalid parameter"),
    INTERNAL_ERROR(10007, "internal error");

    private final int code;
    private final String message;

    ErrorCode(int code, String message) {
        this.code = code;
        this.message = message;
    }

    public int code() {
        return code;
    }

    public String message() {
        return message;
    }
}
