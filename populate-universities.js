// Quick script to populate all NHSF universities in Firebase
// Run this in your browser console on the teams page

const allUniversities = [
  // NORTH & CENTRAL ZONE (NZ+CZ)
  { name: "Aston", zone: "NZ+CZ", abbr: "AST" },
  { name: "Birmingham", zone: "NZ+CZ", abbr: "BIR" },
  { name: "Cambridge", zone: "NZ+CZ", abbr: "CAM" },
  { name: "Coventry", zone: "NZ+CZ", abbr: "COV" },
  { name: "DMU", zone: "NZ+CZ", abbr: "DMU" },
  { name: "Dundee", zone: "NZ+CZ", abbr: "DUN" },
  { name: "East Anglia", zone: "NZ+CZ", abbr: "UEA" },
  { name: "Edinburgh", zone: "NZ+CZ", abbr: "EDI" },
  { name: "Keele", zone: "NZ+CZ", abbr: "KEE" },
  { name: "Lancaster", zone: "NZ+CZ", abbr: "LAN" },
  { name: "Leeds", zone: "NZ+CZ", abbr: "LEE" },
  { name: "Leicester", zone: "NZ+CZ", abbr: "LEI" },
  { name: "Loughborough", zone: "NZ+CZ", abbr: "LBO" },
  { name: "Manchester", zone: "NZ+CZ", abbr: "MAN" },
  { name: "Northampton", zone: "NZ+CZ", abbr: "NOR" },
  { name: "Nottingham", zone: "NZ+CZ", abbr: "NOT" },
  { name: "Nottingham Trent", zone: "NZ+CZ", abbr: "NTU" },
  { name: "Sheffield", zone: "NZ+CZ", abbr: "SHE" },
  { name: "UCLAN", zone: "NZ+CZ", abbr: "UCL" },
  { name: "Warwick", zone: "NZ+CZ", abbr: "WAR" },
  { name: "York", zone: "NZ+CZ", abbr: "YOR" },
  { name: "Derby", zone: "NZ+CZ", abbr: "DER" },

  // LONDON & SOUTH ZONE (LZ+SZ)
  { name: "ARU", zone: "LZ+SZ", abbr: "ARU" },
  { name: "Bristol", zone: "LZ+SZ", abbr: "BRI" },
  { name: "Brunel", zone: "LZ+SZ", abbr: "BRU" },
  { name: "Cardiff", zone: "LZ+SZ", abbr: "CAR" },
  { name: "City", zone: "LZ+SZ", abbr: "CIT" },
  { name: "East London", zone: "LZ+SZ", abbr: "EL" },
  { name: "Essex", zone: "LZ+SZ", abbr: "ESS" },
  { name: "Exeter", zone: "LZ+SZ", abbr: "EXE" },
  { name: "Greenwich", zone: "LZ+SZ", abbr: "GRE" },
  { name: "Hertfordshire", zone: "LZ+SZ", abbr: "HER" },
  { name: "Imperial", zone: "LZ+SZ", abbr: "IMP" },
  { name: "KCL", zone: "LZ+SZ", abbr: "KCL" },
  { name: "LSE", zone: "LZ+SZ", abbr: "LSE" },
  { name: "Oxford", zone: "LZ+SZ", abbr: "OXF" },
  { name: "Oxford Brookes", zone: "LZ+SZ", abbr: "OXB" },
  { name: "Plymouth", zone: "LZ+SZ", abbr: "PLY" },
  { name: "Portsmouth", zone: "LZ+SZ", abbr: "POR" },
  { name: "QMUL", zone: "LZ+SZ", abbr: "QML" },
  { name: "Royal Holloway", zone: "LZ+SZ", abbr: "RH" },
  { name: "St George's", zone: "LZ+SZ", abbr: "SG" },
  { name: "Swansea", zone: "LZ+SZ", abbr: "SWA" },
  { name: "UCL", zone: "LZ+SZ", abbr: "UCL" },
  { name: "Westminster", zone: "LZ+SZ", abbr: "WES" },
  { name: "Reading", zone: "LZ+SZ", abbr: "REA" }
];

// Function to populate universities
async function populateUniversities() {
  try {
    const response = await fetch('/api/initialize-universities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Universities populated successfully!');
      console.log(`Total: ${result.summary.total} universities`);
      console.log(`NZ+CZ: ${result.summary.nzCz} universities`);
      console.log(`LZ+SZ: ${result.summary.lzSz} universities`);
      alert(`All ${result.summary.total} NHSF universities have been added to the database!`);
    } else {
      console.error('❌ Error:', result.error);
      alert('Error: ' + result.error);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
    alert('Network error: ' + error.message);
  }
}

// Run the function
populateUniversities();
