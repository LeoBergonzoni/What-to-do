document.getElementById("geolocate").addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Geolocalizzazione non supportata.");
    return;
  }

  navigator.geolocation.getCurrentPosition(success, error);

  function success(position) {
    const { latitude, longitude } = position.coords;
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
      .then(response => response.json())
      .then(data => {
        document.getElementById("location").value = data.display_name;
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
    const response = await fetch("/.netlify/functions/gpt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt })
    });

    const data = await response.json();

    if (data.error) throw new Error(data.error);

    const output = data.response;
    const [attivita, itinerario] = output.split(/Itinerario:|Itinerary:/i);

    document.getElementById("activities").textContent = attivita?.trim() || "Nessuna attività trovata.";
    document.getElementById("itinerary").textContent = itinerario?.trim() || "Nessun itinerario suggerito.";
    document.getElementById("results").classList.remove("hidden");
  } catch (err) {
    alert("Errore: " + err.message);
  }
});

function copyContent(id) {
  const text = document.getElementById(id).textContent;
  navigator.clipboard.writeText(text)
    .then(() => alert("Contenuto copiato!"))
    .catch(() => alert("Errore durante la copia"));
}