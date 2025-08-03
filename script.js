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
    function parseMarkdownLinks(text) {
      return text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    }
    
    const parts = output.split(/Itinerario consigliato:|Itinerario:|Itinerary:/i);
    
    const activitiesText = parts[0]?.trim() || "Nessuna attività trovata.";
    const itineraryText = parts[1]?.trim() || "Nessun itinerario suggerito.";
    
    // Inserisci HTML (non textContent) per rendere i link cliccabili
    document.getElementById("activities").innerHTML = parseMarkdownLinks(activitiesText);
    
    // Se l'itinerario ha struttura tipo elenco orari, preserva l'indentazione
    const itineraryList = itineraryText
    .split(/\n+/)
    .filter(line => line.trim())
    .map(line => `<li>${line.trim()}</li>`)
    .join("");
  
  document.getElementById("itinerary").classList.add("timeline");
  document.getElementById("itinerary").innerHTML = `<ul>${itineraryList}</ul>`;
  document.getElementById("loading").classList.add("hidden");
  document.getElementById("loading").classList.remove("hidden");
  document.getElementById("results").classList.add("hidden");
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