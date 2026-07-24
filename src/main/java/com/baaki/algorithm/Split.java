package com.baaki.algorithm;

/** One user's share of an expense, in minor units (paise). */
public record Split(Long userId, long amount) {
}
