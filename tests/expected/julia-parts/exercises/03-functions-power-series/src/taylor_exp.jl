# The Taylor polynomial T_n(x) of the exponential function at 0.
function taylor_exp(x, n)
    term = 1.0
    total = 1.0
    for k in 1:n
        term *= x / k
        total += term
    end
    return total
end
