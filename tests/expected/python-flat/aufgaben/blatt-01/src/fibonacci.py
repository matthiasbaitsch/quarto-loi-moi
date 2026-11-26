def fibonacci_ratios(F):
    """The ratios q_n = F[n+1] / F[n] of a list F of Fibonacci numbers."""
    return [b / a for a, b in zip(F, F[1:])]
