# Bohrpfahl: Parameter und exakte Lösung

# Basiswerte
E = 35e9
d = 0.8
l = 20
F = 2e6
ρ = 2500
g = 9.81
S = 120e6
c = 1.75e7

# Abgeleitete Werte
C = c * π * d
A = π * d^2 / 4
EA = E * A
n = ρ * g * A

# Exakte Lösung
λ = sqrt(C / EA)
D = EA * λ * sinh(λ * l) + S * cosh(λ * l)
u(x) = n / C * (1 - S * cosh(λ * x) / D) + F / (EA * λ * D) * (EA * λ * cosh(λ * (l - x)) + S * sinh(λ * (l - x)))
