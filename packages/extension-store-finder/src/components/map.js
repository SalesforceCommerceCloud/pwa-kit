/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'

const MapComponent = ({containerProps = {}, markers = []}) => {
    return (
        <MapContainer {...containerProps} style={{ height: '100%', width: '100%' }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
            />
            {markers.map((marker, index) => (
                <Marker key={index} {...marker}>
                    <Popup>
                        <strong>{marker.name}</strong><br />
                        {marker.text}
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    )
}

export default MapComponent