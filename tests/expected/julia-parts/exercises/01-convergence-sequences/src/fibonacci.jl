# The ratios q_1, ..., q_n of consecutive Fibonacci numbers, q_k = F_{k+1} / F_k.
function fibonacci_ratios(n)
    a, b = 1, 1
    ratios = Float64[]
    for k in 1:n
        push!(ratios, b / a)
        a, b = b, a + b
    end
    return ratios
end
