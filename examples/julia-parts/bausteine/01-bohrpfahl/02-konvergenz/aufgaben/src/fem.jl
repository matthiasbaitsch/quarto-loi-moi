using LinearAlgebra

# Finite-Elemente-Lösung für den Bohrpfahl mit Ne linearen Elementen. Rückgabe sind die Knoten und die
# Verschiebungen an den Knoten.
function pile_fem(Ne)
    h = l / Ne
    N = Ne + 1

    # Elementsteifigkeitsmatrix und Elementlastvektor
    Ke = EA / h * [1 -1; -1 1] + C * h / 6 * [2 1; 1 2]
    re = n * h / 2 * [1, 1]

    # Assemblierung
    K = zeros(N, N)
    r = zeros(N)
    for e = 1:Ne
        I = [e, e + 1]
        K[I, I] += Ke
        r[I] += re
    end

    # Feder am Fuß, Kraft am Kopf
    K[N, N] += S
    r[1] += F

    return range(0, l, N), K \ r
end
