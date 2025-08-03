const apiKey = import.meta.env.VITE_OPENAI_API_KEY || ""; // fallback per Netlify env var

document.getElementById("geolocate").addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Geolocalizzazione non supportata dal browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(success, error);

  function success(position) {
    const { latitude, longitude } = position.coords;
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
      .then(response => response.json())
      .then(data => {
        const location = data.display_name;
        document.getElementById("location").value = location;
      });
  }

  function error() {
    alert("Impossibile ottenere la posizione.");
  }
});

document.getElementById("generate").addEventListener("click", async () => {
  const location = document.getElementById("location").value.trim();
  if (!location) {
    alert("Inserisci una posizione!");
    return;
  }

  const hour = new Date().getHours();
  const prompt = `Mi trovo a "${location}" e sono le ${hour}:00. Suggeriscimi attività divertenti da fare ora, considerando l'orario e i posti vicini (musei, bar, cinema, eventi, ecc.). Includi link se disponibili. Infine crea un itinerario breve con orari consigliati.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4", // usa gpt-4 o gpt-3.5-turbo se preferisci
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8
      })
    });

    const data = await response.json();
    const output = data.choices?.[0]?.message?.content || "Nessuna risposta generata.";

    // Separazione grezza in due sezioni (può essere migliorata)
    const [attivita, itinerario] = output.split(/Itinerario:|Itinerary:/i);

    document.getElementById("activities").textContent = attivita?.trim() || "Nessuna attività trovata.";
    document.getElementById("itinerary").textContent = itinerario?.trim() || "Nessun itinerario suggerito.";

    document.getElementById("results").classList.remove("hidden");
  } catch (error) {
    console.error("Errore nella richiesta:", error);
    alert("Errore nella richiesta all'AI. Riprova più tardi.");
  }
});

function copyContent(id) {
  const text = document.getElementById(id).textContent;
  navigator.clipboard.writeText(text)
    .then(() => alert("Contenuto copiato!"))
    .catch(() => alert("Errore durante la copia"));
}