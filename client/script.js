// DOM Elements
const loginContainer = document.getElementById('login-container');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const userGreeting = document.getElementById('user-greeting');
const routesListEl = document.getElementById('routes-list');
const routeNameEl = document.getElementById('route-name');
const createRouteBtn = document.getElementById('create-route');
const registerForm = document.getElementById('register-form');
const regUsername = document.getElementById('reg-username');
const regPassword = document.getElementById('reg-password');

// Application State
let routes = [];
let activeRouteId = null;
let currentUserId = null;
let routeMarkers = null;
let routeLines = null;
let map = null;

const API_URL = 'http://localhost:3000/api';

// Event Listener para Registro
registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = regUsername.value;
    const password = regPassword.value;
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const data = await response.json();
        if (response.ok) {
            currentUserId = data.userId;
            localStorage.setItem('userId', currentUserId);
            showApp();
        } else {
            alert(data.message || 'Registration failed');
        }
    } catch (err) {
        console.error('Register error:', err);
        alert('Registration failed');
    }
    regUsername.value = '';
    regPassword.value = '';
});

// Initialize Map (after login)
function initMap() {
    if (map) {
        // If map exists, just reset the view
        map.setView([49.8153, 6.1296], 13);
        return;
    }
    
    // Initialize map only if it doesn't exist
    map = L.map('map').setView([49.8153, 6.1296], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    routeMarkers = L.layerGroup().addTo(map);
    routeLines = L.layerGroup().addTo(map);

    map.on('click', function(e) {
        addPointToRoute(e.latlng);
    });
}

// Login Functionality
function checkAuth() {
    const userId = localStorage.getItem('userId');
    if (userId) {
        currentUserId = userId;
        showApp();
    }
}

function showApp() {
    loginContainer.style.display = 'none';
    appContainer.style.display = 'flex';
    userGreeting.textContent = `Hello, User!`; // Update with real username if needed
    initMap();
    loadRoutes();
}

function hideApp() {
    loginContainer.style.display = 'block';
    appContainer.style.display = 'none';
    currentUserId = null;
    
    // Clean up map
    if (map) {
        map.remove();
        map = null;
        routeMarkers = null;
        routeLines = null;
    }
}

// Route Management
async function createNewRoute() {
    const routeName = routeNameEl.value.trim();
    if (!routeName) return;

    try {
        const response = await fetch(`${API_URL}/routes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'user-id': currentUserId,
            },
            body: JSON.stringify({ name: routeName }),
        });
        const newRoute = await response.json();
        routes.unshift(newRoute);
        activeRouteId = newRoute._id;
        renderRoutesList();
        routeNameEl.value = '';
        clearMap();
    } catch (err) {
        console.error('Error creating route:', err);
    }
}

async function addPointToRoute(latlng) {
    if (!activeRouteId) {
        alert('First create or select a route');
        routeNameEl.focus();
        return;
    }

    const route = routes.find(r => r._id === activeRouteId);
    if (route) {
        const pointName = prompt('Enter point name:', `Point ${route.points.length + 1}`);
        if (pointName === null) return;

        const newPoint = {
            name: pointName || `Point ${route.points.length + 1}`,
            latlng: [latlng.lat, latlng.lng],
        };

        try {
            const response = await fetch(`${API_URL}/routes/${activeRouteId}/point`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'user-id': currentUserId,
                },
                body: JSON.stringify({ point: newPoint }),
            });
            const updatedRoute = await response.json();
            const routeIndex = routes.findIndex(r => r._id === activeRouteId);
            routes[routeIndex] = updatedRoute;
            renderRoutesList();
            drawRouteOnMap(updatedRoute);
        } catch (err) {
            console.error('Error adding point:', err);
        }
    }
}

function drawRouteOnMap(route) {
    routeMarkers.clearLayers();
    routeLines.clearLayers();
    
    if (route.points.length > 0) {
        const latlngs = route.points.map(p => p.latlng);
        const polyline = L.polyline(latlngs, { color: 'blue' }).addTo(routeLines);
        
        route.points.forEach(point => {
            L.marker(point.latlng, {
                draggable: true,
                title: point.name
            })
            .bindPopup(`<b>${point.name}</b><br>${point.latlng[0].toFixed(4)}, ${point.latlng[1].toFixed(4)}`)
            .addTo(routeMarkers)
            .on('dragend', async function(e) {
                const marker = e.target;
                const newPosition = marker.getLatLng();
                const pointIndex = route.points.findIndex(p => 
                    p.latlng[0] === point.latlng[0] && p.latlng[1] === point.latlng[1]
                );
                if (pointIndex !== -1) {
                    route.points[pointIndex].latlng = [newPosition.lat, newPosition.lng];
                    try {
                        await fetch(`${API_URL}/routes/${activeRouteId}/point`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'user-id': currentUserId,
                            },
                            body: JSON.stringify({ point: route.points[pointIndex] }),
                        });
                        drawRouteOnMap(route);
                    } catch (err) {
                        console.error('Error updating point:', err);
                    }
                }
            });
        });
        
        // Ajustar el mapa a los puntos de la ruta
        const bounds = L.latLngBounds(route.points.map(p => p.latlng));
        map.fitBounds(bounds, { padding: [50, 50] });
    }
}

function clearMap() {
    routeMarkers.clearLayers();
    routeLines.clearLayers();
}

function renderRoutesList() {
    routesListEl.innerHTML = '';

    routes.forEach(route => {
        const routeEl = document.createElement('div');
        routeEl.className = `route ${route._id === activeRouteId ? 'active-route' : ''}`;
        routeEl.innerHTML = `
            <h3>${route.name}</h3>
            <p>${route.points.length} points</p>
            <div class="points-list" id="points-${route._id}"></div>
            <div class="route-actions">
                <button class="select-route" data-id="${route._id}">Select</button>
                <button class="delete-route" data-id="${route._id}">Delete</button>
            </div>
        `;

        const pointsListEl = routeEl.querySelector(`.points-list`);
        route.points.forEach(point => {
            const pointEl = document.createElement('div');
            pointEl.className = 'point-item';
            pointEl.innerHTML = `
                ${point.name}: ${point.latlng[0].toFixed(4)}, ${point.latlng[1].toFixed(4)}
                <button class="edit-point" data-route-id="${route._id}" data-point-id="${point._id}"><i class="fas fa-edit"></i></button>
                <button class="delete-point" data-route-id="${route._id}" data-point-id="${point._id}"><i class="fas fa-trash"></i></button>`; 
                pointsListEl.appendChild(pointEl);
        });
        routesListEl.appendChild(routeEl);

        routeEl.querySelector('.select-route').addEventListener('click', () => {
           
            activeRouteId = route._id;
            // Mover el mapa a la ruta seleccionada
            if (route.points.length > 0) {
                const bounds = L.latLngBounds(route.points.map(p => p.latlng));
                map.fitBounds(bounds, { padding: [50, 50] }); // Ajusta el zoom y centra
            } else {
                map.setView([49.8153, 6.1296], 13); // Centro por defecto si no hay puntos
            } 
            renderRoutesList();
            drawRouteOnMap(route);
        });

        routeEl.querySelector('.delete-route').addEventListener('click', async () => {
            if (confirm(`Delete route "${route.name}"?`)) {
                try {
                    await fetch(`${API_URL}/routes/${route._id}`, {
                        method: 'DELETE',
                        headers: { 'user-id': currentUserId },
                    });
                    routes = routes.filter(r => r._id !== route._id);
                    if (activeRouteId === route._id) {
                        activeRouteId = null;
                        clearMap();
                    }
                    renderRoutesList();
                } catch (err) {
                    console.error('Error deleting route:', err);
                }
            }
        });

        // Añadir evento para eliminar puntos
        routeEl.querySelectorAll('.delete-point').forEach(button => {
            button.addEventListener('click', async () => {
                const routeId = button.getAttribute('data-route-id');
                const pointId = button.getAttribute('data-point-id');
                const pointName = route.points.find(p => p._id === pointId)?.name || 'this point';
                console.log('Deleting point:', { routeId, pointId });
                if (confirm(`Delete point "${pointName}"?`)) {
                    try {
                        const response = await fetch(`${API_URL}/routes/${routeId}/point/${pointId}`, {
                            method: 'DELETE',
                            headers: { 'user-id': currentUserId },
                        });
                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                        }
                        const updatedRoute = await response.json();
                        const routeIndex = routes.findIndex(r => r._id === routeId);
                        routes[routeIndex] = updatedRoute;
                        renderRoutesList();
                        if (activeRouteId === routeId) {
                            drawRouteOnMap(updatedRoute);
                            if (updatedRoute.points.length > 0) {
                                // Usar los puntos de la ruta para calcular los límites
                                const bounds = L.latLngBounds(updatedRoute.points.map(p => p.latlng));
                                map.fitBounds(bounds, { padding: [50, 50] });
                            } else {
                                map.setView([49.8153, 6.1296], 13); // Centro por defecto si no hay puntos
                            }
                        }
                    } catch (err) {
                        console.error('Error deleting point:', err);
                        alert('Failed to delete point: ' + err.message);
                    }
                }
            });
        });

        // Edit Point
        routeEl.querySelectorAll('.edit-point').forEach(button => {
            button.addEventListener('click', async () => {
                const routeId = button.getAttribute('data-route-id');
                const pointId = button.getAttribute('data-point-id');
                const currentPoint = route.points.find(p => p._id === pointId);
                const newName = prompt(`Enter new name for "${currentPoint.name}":`, currentPoint.name);
                if (newName !== null && newName.trim() !== '') {
                    try {
                        const response = await fetch(`${API_URL}/routes/${routeId}/point/${pointId}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'user-id': currentUserId,
                            },
                            body: JSON.stringify({ name: newName.trim() }),
                        });
                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                        }
                        const updatedRoute = await response.json();
                        const routeIndex = routes.findIndex(r => r._id === routeId);
                        routes[routeIndex] = updatedRoute;
                        renderRoutesList();
                        if (activeRouteId === routeId) {
                            drawRouteOnMap(updatedRoute);
                            if (updatedRoute.points.length > 0) {
                                const bounds = L.latLngBounds(updatedRoute.points.map(p => p.latlng));
                                map.fitBounds(bounds, { padding: [50, 50] });
                            }
                        }
                    } catch (err) {
                        console.error('Error updating point name:', err);
                        alert('Failed to update point name: ' + err.message);
                    }
                }
            });
        });

    });
}

// Load Routes from Backend
async function loadRoutes() {
    try {
        const response = await fetch(`${API_URL}/routes`, {
            headers: { 'user-id': currentUserId },
        });
        routes = await response.json();
        renderRoutesList();
    } catch (err) {
        console.error('Error loading routes:', err);
    }
}

// Event Listeners
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const data = await response.json();
        console.log(data);
        if (data.userId) {
            currentUserId = data.userId;
            localStorage.setItem('userId', currentUserId);
            showApp();
        } else {
            alert('Invalid username or password');
        }
    } catch (err) {
        console.error('Login error:', err);
        alert('Login failed');
    }
});

logoutBtn.addEventListener('click', function() {
    localStorage.removeItem('userId');
    hideApp();
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
});

createRouteBtn.addEventListener('click', createNewRoute);

// Initialize app
checkAuth();