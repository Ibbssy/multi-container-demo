(function initializeDispatchMap() {
    const mapElement = document.getElementById('dispatch-map');

    if (!mapElement || typeof L === 'undefined') {
        return;
    }

    const latitudeInput = document.getElementById('dispatchLatitude');
    const longitudeInput = document.getElementById('dispatchLongitude');
    const readout = document.getElementById('dispatch-location-readout');
    const form = mapElement.closest('form');
    const submitButton = form ? form.querySelector('button[type="submit"]') : null;
    const submitBlockedByServer = submitButton ? submitButton.disabled : false;

    const defaultLatitude = Number.parseFloat(mapElement.dataset.defaultLat);
    const defaultLongitude = Number.parseFloat(mapElement.dataset.defaultLng);
    const selectedLatitude = Number.parseFloat(mapElement.dataset.selectedLat);
    const selectedLongitude = Number.parseFloat(mapElement.dataset.selectedLng);

    const hasInitialLocation = Number.isFinite(selectedLatitude) && Number.isFinite(selectedLongitude);
    const initialCenter = hasInitialLocation
        ? [selectedLatitude, selectedLongitude]
        : [defaultLatitude, defaultLongitude];

    const map = L.map(mapElement, {
        scrollWheelZoom: true
    }).setView(initialCenter, hasInitialLocation ? 16 : 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    let marker = null;

    const updateSubmitState = () => {
        if (!submitButton || submitBlockedByServer) {
            return;
        }

        submitButton.disabled = !(latitudeInput.value && longitudeInput.value);
    };

    const updateReadout = (latitude, longitude) => {
        if (!readout) {
            return;
        }

        readout.textContent = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    };

    const setMarkerLocation = (latlng) => {
        const latitude = Number.parseFloat(latlng.lat);
        const longitude = Number.parseFloat(latlng.lng);

        latitudeInput.value = latitude.toFixed(6);
        longitudeInput.value = longitude.toFixed(6);
        updateReadout(latitude, longitude);

        if (!marker) {
            marker = L.marker([latitude, longitude], { draggable: true }).addTo(map);
            marker.on('dragend', () => {
                setMarkerLocation(marker.getLatLng());
            });
        } else {
            marker.setLatLng([latitude, longitude]);
        }

        updateSubmitState();
    };

    map.on('click', (event) => {
        setMarkerLocation(event.latlng);
    });

    if (hasInitialLocation) {
        setMarkerLocation({ lat: selectedLatitude, lng: selectedLongitude });
    } else {
        updateSubmitState();
    }

    window.requestAnimationFrame(() => {
        map.invalidateSize();
    });
})();
