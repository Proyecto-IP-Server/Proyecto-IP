/**
 * SCHEDULE GENERATOR ENGINE
 * Ported from Apeiron Java (PrimeroElMejor.java / ModeloCombinatorio.java)
 */

// Bitmask constants based on Horario.java
// Represents hours from 07:00 to 21:00 (15 slots)
const BITS = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384];
const DIAS = ['L', 'M', 'I', 'J', 'V', 'S']; // Mapped to 0-5

class Horario {
  constructor() {
    this.slots = [0, 0, 0, 0, 0, 0]; // Mon-Sat integers
    this.totalVal = 0;
  }

  clone() {
    const h = new Horario();
    h.slots = [...this.slots];
    h.totalVal = this.totalVal;
    return h;
  }

  // Converts API time string "HHmm-HHmm" or objects to bitmask
  // Logic derived from Horario.java: setHora
  static fromData(horariosArray) {
    const h = new Horario();
    if (!horariosArray) return h;

    horariosArray.forEach(slot => {
      // Handle different input formats (API vs UI objects)
      const diaIndex = typeof slot.dia_semana === 'number' 
        ? slot.dia_semana 
        : getDayIndex(slot.dia);
        
      if (diaIndex === -1) return;

      const startHour = parseInt(slot.hora_inicio.split(':')[0]);
      const endHour = parseInt(slot.hora_fin.split(':')[0]);

      // Shift to 0-based index (7am is index 0)
      const startIdx = startHour - 7; 
      const endIdx = endHour - 7;

      let mask = 0;
      for (let i = startIdx; i < endIdx; i++) {
        if (i >= 0 && i < BITS.length) {
          mask |= BITS[i];
        }
      }
      h.slots[diaIndex] |= mask;
    });
    h.calculateTotal();
    return h;
  }

  add(otherHorario) {
    for (let i = 0; i < 6; i++) {
      this.slots[i] |= otherHorario.slots[i];
    }
    this.calculateTotal();
  }

  remove(otherHorario) {
    for (let i = 0; i < 6; i++) {
      // XOR to remove bits that are set in both
      // Only works correctly if we know otherHorario is strictly inside this.slots
      // Safer to use bitwise AND NOT: a & ~b
      this.slots[i] &= ~otherHorario.slots[i];
    }
    this.calculateTotal();
  }

  // Checks collision (Horario.java: compatible)
  isCompatible(otherHorario) {
    for (let i = 0; i < 6; i++) {
      if ((this.slots[i] & otherHorario.slots[i]) !== 0) {
        return false;
      }
    }
    return true;
  }

  calculateTotal() {
    this.totalVal = this.slots.reduce((a, b) => a + b, 0);
  }

  // Logic from Horario.java: getHuecos
  countHuecos() {
    let huecos = 0;
    for (let dia = 0; dia < 6; dia++) {
      const val = this.slots[dia];
      if (val === 0) continue;

      // Find first set bit (start of day)
      let start = -1;
      for (let i = 0; i < BITS.length; i++) {
        if ((val & BITS[i]) !== 0) {
          start = i;
          break;
        }
      }

      // Find last set bit (end of day)
      let end = -1;
      for (let i = BITS.length - 1; i >= 0; i--) {
        if ((val & BITS[i]) !== 0) {
          end = i;
          break;
        }
      }

      // Count zeros between start and end
      if (start !== -1 && end !== -1) {
        for (let i = start; i <= end; i++) {
          if ((val & BITS[i]) === 0) {
            huecos++;
          }
        }
      }
    }
    return huecos;
  }
}

class GeneratorEngine {
  constructor(data, options, constraints) {
    this.materias = data; // Array of Arrays (Materia -> Secciones)
    this.options = options;
    this.constraints = constraints; // Horario object of unavailable times
    
    this.solutions = [];
    this.maxSolutions = options.maxHorarios === -1 ? 1000 : options.maxHorarios;
    this.maxHuecos = options.huecosFinales;
    this.maxHuecosInt = options.huecosIntermedios;
  }

  // Based on PrimeroElMejor.java: ordenarPor...
  sortGroups(groups, currentSolution) {
    const { prioridadDemanda, prioridadHora } = this.options;

    return groups.map(g => {
      // Calculate gaps if we were to add this group
      const tempH = currentSolution.clone();
      tempH.add(g.horarioObj);
      g.calculatedHuecos = tempH.countHuecos();
      return g;
    }).sort((a, b) => {
      
      // 1. Primary heuristic: Gaps (PrimeroElMejor logic)
      // Always try to minimize gaps first as per original algorithm structure
      if (a.calculatedHuecos !== b.calculatedHuecos) {
        return a.calculatedHuecos - b.calculatedHuecos;
      }

      // 2. User Preference: Availability (Demanda)
      if (prioridadDemanda !== 0) {
        // If priority > 0, prefer higher availability (less full)
        // If priority < 0, prefer lower availability (more full)
        const diff = b.disponibilidad - a.disponibilidad;
        if (diff !== 0) return prioridadDemanda > 0 ? -diff : diff;
      }

      // 3. User Preference: Time (Hora)
      if (prioridadHora !== 0) {
        const valA = a.horarioObj.totalVal;
        const valB = b.horarioObj.totalVal;
        // If priority > 0 (Tarde), prefer higher bit values
        // If priority < 0 (Temprano), prefer lower bit values
        const diff = valB - valA;
        if (diff !== 0) return prioridadHora > 0 ? diff : -diff;
      }

      return 0;
    });
  }

  // Recursive DFS (PrimeroElMejor.java: ponerMateria)
  solve(materiaIndex, currentSolution, accumulatedGroups) {
    // Stop if we have enough solutions
    if (this.solutions.length >= this.maxSolutions) return;

    // Base Case: All subjects assigned
    if (materiaIndex >= this.materias.length) {
      // Verify final constraint
      const huecosFinales = currentSolution.countHuecos();
      if (this.maxHuecos === -1 || huecosFinales <= this.maxHuecos) {
        this.solutions.push({
          id: this.solutions.length + 1,
          materias: [...accumulatedGroups], // Clone array
          stats: { huecos: huecosFinales }
        });
      }
      return;
    }

    // Get available sections for this subject
    let groups = this.materias[materiaIndex];

    // Sort groups to try "best" fits first
    groups = this.sortGroups(groups, currentSolution);

    for (const group of groups) {
      // 1. Check Compatibility (Collision)
      if (!currentSolution.isCompatible(group.horarioObj)) {
        continue; // Skip if overlap
      }

      // 2. Check Intermediate Gaps (Pruning)
      // The sortGroups function already calculated this, we can reuse or recalculate
      const tempHuecos = group.calculatedHuecos; 
      
      if (this.maxHuecosInt !== -1 && tempHuecos > this.maxHuecosInt) {
        continue; // Prune branch
      }

      // 3. Backtracking Step
      currentSolution.add(group.horarioObj);
      accumulatedGroups.push(group);

      this.solve(materiaIndex + 1, currentSolution, accumulatedGroups);

      // Backtrack
      accumulatedGroups.pop();
      currentSolution.remove(group.horarioObj);

      if (this.solutions.length >= this.maxSolutions) break;
    }
  }

  start() {
    // Initial state: Current schedule contains only user constraints (blocked times)
    const initialHorario = this.constraints ? this.constraints.clone() : new Horario();
    this.solve(0, initialHorario, []);
    return this.solutions;
  }
}

// Helpers
function getDayIndex(dayStr) {
  if (!dayStr) return -1;
  // Handle "Lunes", "L", etc.
  const map = { 'lun':0, 'mar':1, 'mié':2, 'mie':2, 'jue':3, 'vie':4, 'sáb':5, 'sab':5 };
  const short = dayStr.toLowerCase().substring(0, 3);
  return map[short] !== undefined ? map[short] : -1;
}

// Main Exported Function
export const generateSchedules = (
  materiasConfig, // From UI: [{ clave, nombreMateria, profesores: {...} }]
  seccionesData,  // Raw API response array containing all sections for the selected subjects
  options,        // { maxHorarios, cupos, etc }
  blockedSchedule // Object/Array representing disabled cells
) => {

  console.log("Iniciando Motor de Generación JS...");

  // 1. Pre-process Sections into Groups with Bitmasks
  // We need to group sections by Subject (Materia)
  const materiasMap = new Map();
  
  materiasConfig.forEach(conf => {
    materiasMap.set(conf.clave, []);
  });

  seccionesData.flat().forEach(seccion => {
    // Find which configured subject this section belongs to
    // Note: You need to ensure 'seccion' object has 'clave_materia' or similar
    // If the API sections don't have the parent Code, you need to pass that association
    // Assuming the passed 'seccionesData' is an array of arrays matching 'materiasConfig' order is risky
    // Better to rely on the Input Data structure.
    
    // If logic relies on index matching:
    // We will assume seccionesData is [[sections_for_mat_1], [sections_for_mat_2]]
  });

  // Re-structure input based on how OptionSidebarView usually fetches data
  // Since OptionSidebarView fetches individually, let's assume 'seccionesData' is an Array of Arrays
  // where index matches 'materiasConfig' index.

  const materiasGroups = seccionesData.map((sectionsList, index) => {
    const config = materiasConfig[index];
    const allowedProfs = config.profesores; // { "Prof Name": 1 (Like), 2 (Dislike), 0 (Neutral) }

    return sectionsList
      .filter(sec => {
        // Filter 1: Cupos
        if (options.cupos && sec.cupos <= 0) return false;

        // Filter 2: Dislikes (Marked as 2)
        const profStatus = allowedProfs[sec.profesor] || 0;
        if (profStatus === 2) return false;

        return true;
      })
      .map(sec => {
        // Transform to Internal Group Object
        return {
          ...sec, // Keep original properties (nrc, profesor, etc)
          nombre: config.nombreMateria,
          codigo: config.clave,
          horarioObj: Horario.fromData(sec.sesiones), // Create Bitmask
          horarios: formatHorariosForView(sec.sesiones) // Pre-format for View
        };
      });
  });

  // 2. Sort Subjects (Optional Optimization)
  // Apeiron's `ordenaPorNdGrupos`: Process subjects with fewest options first to fail fast
  const sortedIndices = materiasGroups.map((_, i) => i)
    .sort((a, b) => materiasGroups[a].length - materiasGroups[b].length);
  
  const sortedMateriasGroups = sortedIndices.map(i => materiasGroups[i]);

  // 3. Prepare Constraints
  const constraintHorario = new Horario();
  // TODO: convert `blockedSchedule` (UI format) to `constraintHorario` (Bitmask)
  // Assuming blockedSchedule is simple array of {day, time} or similar

  // 4. Run Engine
  const engine = new GeneratorEngine(sortedMateriasGroups, options, constraintHorario);
  const results = engine.start();

  console.log(`Generación completada. ${results.length} horarios encontrados.`);
  return results;
};

// Format helper for the View
function formatHorariosForView(sesiones) {
  const diasMap = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return sesiones.map(s => ({
    dia: diasMap[s.dia_semana] || 'Desconocido',
    horaInicio: s.hora_inicio.substring(0, 5),
    horaFin: s.hora_fin.substring(0, 5),
    aula: s.salon + (s.edificio ? ` ${s.edificio}` : '')
  }));
}