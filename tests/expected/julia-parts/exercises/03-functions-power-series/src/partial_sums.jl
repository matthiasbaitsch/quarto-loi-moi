# lm-no-attach
# The partial sums s_1, ..., s_n of the alternating harmonic series.
function partial_sums(n)
    s = 0.0
    sums = Float64[]
    for k in 1:n
        s += (-1)^(k + 1) / k
        push!(sums, s)
    end
    return sums
end
