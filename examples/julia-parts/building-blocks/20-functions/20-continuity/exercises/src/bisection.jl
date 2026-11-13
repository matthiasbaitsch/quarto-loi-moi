# The midpoints of the first n intervals of bisection for a zero of f in [a, b].
function bisection(f, a, b, n)
    midpoints = Float64[]
    for k in 1:n
        m = (a + b) / 2
        push!(midpoints, m)
        if sign(f(m)) == sign(f(a))
            a = m
        else
            b = m
        end
    end
    return midpoints
end
