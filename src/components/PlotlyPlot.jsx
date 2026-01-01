import React, { useState, useEffect } from 'react';
// Load plotly from dist-min to avoid massive bundle issues
import Plot from 'react-plotly.js';

export default function PlotlyPlot({ src, ...props }) {
    const [data, setData] = useState(null);
    const [layout, setLayout] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadPlot() {
            try {
                const response = await fetch(src);
                const json = await response.json();
                setData(json.data);
                setLayout(json.layout);
            } catch (e) {
                console.error("Failed to load plot", e);
            } finally {
                setLoading(false);
            }
        }
        loadPlot();
    }, [src]);

    if (loading) {
        return <div style={{ border: '2px solid currentColor', padding: '1rem' }}>Loading Plot...</div>;
    }

    // Brutalist styling for the container?
    // We can let Plotly handle it, but maybe force font?
    // Update layout to match theme
    const isDark = document.documentElement.classList.contains('dark');
    const themeLayout = {
        ...layout,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: {
            family: 'Courier New, monospace',
            color: isDark ? '#ffffff' : '#000000'
        }
    };

    return (
        <div style={{ border: '2px solid var(--text-color)', boxShadow: '6px 6px 0px var(--shadow-color)', margin: '2rem 0' }}>
            <Plot
                data={data}
                layout={themeLayout}
                useResizeHandler={true}
                style={{ width: "100%", height: "100%" }}
                config={{ responsive: true }}
                {...props}
            />
        </div>
    );
}
