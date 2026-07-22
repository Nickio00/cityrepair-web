document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  if (!form) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  let isSubmitting = false;

  const showToast = (msg, tipo = "info", titulo = "") => {
    // Usar el toast integrado en el HTML del login
    const toast = document.getElementById("authToast");
    const msgEl = document.getElementById("authToastMsg");

    if (toast && msgEl) {
      msgEl.textContent = msg;
      // Color según tipo
      if (tipo === "danger" || tipo === "error") {
        toast.style.background = "#fee2e2";
        toast.style.color = "#991b1b";
        toast.style.borderColor = "#fecaca";
      } else if (tipo === "warn") {
        toast.style.background = "#fffbeb";
        toast.style.color = "#92400e";
        toast.style.borderColor = "#fde68a";
      } else if (tipo === "success") {
        toast.style.background = "#f0fdf4";
        toast.style.color = "#166534";
        toast.style.borderColor = "#bbf7d0";
      }
      toast.removeAttribute("hidden");
      setTimeout(() => toast.setAttribute("hidden", ""), 6000);
    } else if (typeof window.mostrarAlerta === "function") {
      window.mostrarAlerta(msg, tipo, { titulo });
    } else {
      alert(msg);
    }
  };

  const minDelay = async (ms = 1000) => {
    return new Promise((r) => setTimeout(r, ms));
  };

  const setLoading = (loading) => {
    if (!submitBtn) return;

    if (loading) {
      submitBtn.dataset.prevText = submitBtn.textContent;
      submitBtn.textContent = "Iniciando sesión…";
      submitBtn.disabled = true;
      form.querySelectorAll("input,button").forEach(el => (el.disabled = true));
    } else {
      submitBtn.textContent = submitBtn.dataset.prevText || "Iniciar Sesión";
      form.querySelectorAll("input,button").forEach(el => (el.disabled = false));
    }
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (isSubmitting) return;
    isSubmitting = true;

    const email = document.querySelector("#email").value.trim();
    const password = document.querySelector("#password").value.trim();

    if (!email || !password) {
      showToast("Por favor completa todos los campos.", "warn", "Campos vacíos");
      isSubmitting = false;
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      await minDelay(1000);

      if (!res.ok) {
        const msg = res.status === 403
          ? "⛔ Cuenta suspendida. Contactá al administrador de EDET."
          : "Correo o contraseña incorrectos";
        throw new Error(msg);
      }

      // ✅ Guardar sesión
    localStorage.setItem("cr_auth", JSON.stringify({
      id: data.user.id,
      email: data.user.email,
      role: data.user.role
}));

      console.log("Usuario logueado:", data.user);

      showToast("Inicio de sesión exitoso", "success", "Bienvenido");

      const TOAST_DURATION = 4000;

      setTimeout(() => setLoading(false), TOAST_DURATION - 300);

      // ✅ REDIRECCIÓN SEGÚN ROL
      setTimeout(() => {

        if (data.user.role === "admin") {
          window.location.href = "edet-dashboard.html";
        } else if (data.user.role === "tecnico") {
          window.location.href = "tecnico-dashboard.html";
        } else {
          window.location.href = "mis-reportes.html";
        }

      }, TOAST_DURATION);

    } catch (error) {
      console.error("Error al iniciar sesión:", error);

      showToast(
        error.message || "Correo o contraseña incorrectos",
        "danger",
        "Error"
      );

      setLoading(false);
      isSubmitting = false;
    }
  });

  // Olvidé mi contraseña → abrir modal
  document.getElementById("forgotPassLink")?.addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("modalForgot").style.display = "flex";
  });
});