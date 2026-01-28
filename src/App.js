import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const VisualizationComponent = ({ cities, solution, showSolution }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!cities || !cities.length) {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const xs = cities.map(c => c.x);
    const ys = cities.map(c => c.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const padding = 40;
    const availableWidth = canvas.width - 2 * padding;
    const availableHeight = canvas.height - 2 * padding;

    const scaleX = availableWidth / (maxX - minX || 1);
    const scaleY = availableHeight / (maxY - minY || 1);
    const scale = Math.min(scaleX, scaleY);

    const contentWidth = (maxX - minX) * scale;
    const contentHeight = (maxY - minY) * scale;
    const offsetX = padding + (availableWidth - contentWidth) / 2;
    const offsetY = padding + (availableHeight - contentHeight) / 2;

    const transform = (x, y) => ({
      x: offsetX + (x - minX) * scale,
      y: canvas.height - (offsetY + (y - minY) * scale) 
    });

    if (showSolution.value && solution && solution.length > 0) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      
      for (let i = 0; i < solution.length; i++) {
        const cityIdx = solution[i];
        const nextCityIdx = solution[(i + 1) % solution.length];
        const city = cities[cityIdx];
        const nextCity = cities[nextCityIdx];
        
        const p1 = transform(city.x, city.y);
        const p2 = transform(nextCity.x, nextCity.y);
        
        if (i === 0) ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
      }
      ctx.stroke();
    }

    cities.forEach((city, idx) => {
      const p = transform(city.x, city.y);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.font = '10px Arial';
      ctx.fillText(idx + 1, p.x + 6, p.y - 6);
    });
  }, [cities, solution, showSolution.value]);

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', marginBottom: '20px', borderRadius: '8px' }}>
      <h2>Wizualizacja problemu</h2>
      {cities.length === 0 && <p style={{color: 'gray'}}>Wczytaj plik, aby zobaczyć wizualizację.</p>}
      <canvas ref={canvasRef} width={600} height={400} style={{ border: '1px solid #ddd', background: '#f9f9f9', display: 'block', margin: '0 auto' }} />
      <div style={{ marginTop: '10px', textAlign: 'center' }}>
        <button 
          onClick={showSolution.toggle}
          disabled={cities.length === 0}
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          {showSolution.value ? 'Ukryj rozwiązanie' : 'Pokaż rozwiązanie'}
        </button>
      </div>
    </div>
  );
};

const SolutionComponent = ({ solution, distance }) => {
  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', marginBottom: '20px', borderRadius: '8px' }}>
      <h2>Rozwiązanie</h2>
      <div style={{ 
        marginBottom: '10px', 
        fontSize: '14px', 
        maxHeight: '100px', 
        overflowY: 'auto',
        fontFamily: 'monospace',
        background: '#f3f4f6',
        padding: '10px'
      }}>
        {solution.length > 0 ? solution.map((cityIdx, i) => (
          <span key={i}>
            {cityIdx + 1}{i < solution.length - 1 ? ' -> ' : ''}
          </span>
        )) : "Brak danych"}
      </div>
      <div style={{ fontWeight: 'bold', fontSize: '18px' }}>
        Długość trasy: {distance !== Infinity ? distance.toFixed(2) : 0}
      </div>
    </div>
  );
};

const AlgorithmControl = ({ onStart, onStop, isRunning, iterations, hasData }) => {
  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', marginBottom: '20px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
      <button 
        onClick={isRunning ? onStop : onStart}
        disabled={!hasData}
        style={{ 
          padding: '10px 20px', 
          cursor: hasData ? 'pointer' : 'not-allowed', 
          background: !hasData ? '#ddd' : (isRunning ? '#fca5a5' : '#86efac'), 
          border: 'none', 
          borderRadius: '4px',
          fontWeight: 'bold',
          fontSize: '16px'
        }}
      >
        {isRunning ? 'Przerwa' : 'Szukaj rozwiązania'}
      </button>
      <span style={{ marginLeft: '20px', fontSize: '18px' }}>Iteracje: <strong>{iterations}</strong></span>
    </div>
  );
};

const ChartComponent = ({ data }) => {
  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
      <h2>Postęp optymalizacji</h2>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="iteration" 
              type="number"               
              allowDecimals={false}       
              domain={['dataMin', 'dataMax']} 
              label={{ value: 'Iteracja', position: 'insideBottomRight', offset: -5 }} 
            />
            <YAxis 
              label={{ value: 'Długość trasy', angle: -90, position: 'insideLeft' }} 
              domain={['auto', 'auto']} 
            />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="distance" 
              stroke="#3b82f6" 
              dot={false}       
              strokeWidth={2} 
              isAnimationActive={false} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
const App = () => {
  const [cities, setCities] = useState([]);
  const [solution, setSolution] = useState([]);
  const [bestDistance, setBestDistance] = useState(Infinity);
  const [isRunning, setIsRunning] = useState(false);
  const [iterations, setIterations] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [showSolution, setShowSolution] = useState(false);
  
  const intervalRef = useRef(null);
  const citiesRef = useRef([]);
  const solutionRef = useRef([]);
  const bestDistanceRef = useRef(Infinity);

  useEffect(() => { citiesRef.current = cities; }, [cities]);
  useEffect(() => { solutionRef.current = solution; }, [solution]);
  useEffect(() => { bestDistanceRef.current = bestDistance; }, [bestDistance]);

  const calculateDistance = (city1, city2) => {
    const dx = city1.x - city2.x;
    const dy = city1.y - city2.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const calculateTotalDistance = (path, citiesData) => {
    let total = 0;
    if (!citiesData.length) return 0;
    for (let i = 0; i < path.length; i++) {
      const city1 = citiesData[path[i]];
      const city2 = citiesData[path[(i + 1) % path.length]];
      total += calculateDistance(city1, city2);
    }
    return total;
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      
      const lines = text.trim().split('\n');
      const parsedCities = lines
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
          const parts = line.split(/\s+/);
          if (parts.length < 3) return null;
          return {
            id: parseInt(parts[0]),
            x: parseFloat(parts[1]),
            y: parseFloat(parts[2])
          };
        })
        .filter(c => c && !isNaN(c.x) && !isNaN(c.y));

      if (parsedCities.length > 0) {
        setCities(parsedCities);
        
        const initialSolution = parsedCities.map((_, idx) => idx);
        for (let i = initialSolution.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [initialSolution[i], initialSolution[j]] = [initialSolution[j], initialSolution[i]];
        }

        const initialDistance = calculateTotalDistance(initialSolution, parsedCities);
        
        setSolution(initialSolution);
        setBestDistance(initialDistance);
        setIterations(0);
        setChartData([{ iteration: 0, distance: initialDistance }]);
        stopAlgorithm(); 
      } else {
        alert("Błąd: Nie udało się odczytać miast z pliku. Sprawdź format.");
      }
    };
    reader.readAsText(file);
  };

  const runIteration = () => {
    const currentCities = citiesRef.current;
    const currentBestSolution = solutionRef.current;
    const currentBestDistance = bestDistanceRef.current;

    if (currentCities.length === 0) return;

    const newCandidate = [...currentBestSolution];
    const i = Math.floor(Math.random() * newCandidate.length);
    const j = Math.floor(Math.random() * newCandidate.length);
    [newCandidate[i], newCandidate[j]] = [newCandidate[j], newCandidate[i]];

    const newDistance = calculateTotalDistance(newCandidate, currentCities);

    setIterations(prev => {
        const nextIter = prev + 1;

        setChartData(prevData => [...prevData, { iteration: nextIter, distance: newDistance }]);

        if (newDistance < currentBestDistance) {
            setSolution(newCandidate);
            setBestDistance(newDistance);
        }
        return nextIter;
    });
  };

  const startAlgorithm = () => {
    if (intervalRef.current) return;
    setIsRunning(true);
    intervalRef.current = setInterval(runIteration, 5000); 
  };

  const stopAlgorithm = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  };

  useEffect(() => {
    return () => stopAlgorithm();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center' }}>Problem Komiwojażera - TSP</h1>
      
      <div style={{ background: '#e0f2fe', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>1. Wczytaj dane</h3>
        <p style={{fontSize: '14px', margin: '5px 0'}}>Wybierz plik tekstowy (np. berlin52.txt) zawierający dane w formacie: <code>ID X Y</code></p>
        <input 
          type="file" 
          accept=".txt" 
          onChange={handleFileUpload}
          style={{ marginTop: '10px' }} 
        />
      </div>

      <VisualizationComponent 
        cities={cities} 
        solution={solution}
        showSolution={{ value: showSolution, toggle: () => setShowSolution(!showSolution) }}
      />
      
      <SolutionComponent 
        solution={solution} 
        distance={bestDistance} 
      />
      
      <AlgorithmControl 
        onStart={startAlgorithm}
        onStop={stopAlgorithm}
        isRunning={isRunning}
        iterations={iterations}
        hasData={cities.length > 0}
      />
      
      <ChartComponent data={chartData} />
    </div>
  );
};

export default App;