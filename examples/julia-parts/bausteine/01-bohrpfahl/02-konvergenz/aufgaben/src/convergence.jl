# Fehler der Kopfverschiebung |u(0) - u_h(0)| für alle Elementanzahlen in Nes
function head_errors(Nes)
    return [abs(u(0) - pile_fem(Ne)[2][1]) for Ne = Nes]
end
