/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState} from "react"
import {Helmet} from 'react-helmet'
import {Layout, Input, List, Card, Col, Row} from "antd"
import {EnvironmentOutlined} from "@ant-design/icons"
import LoadableMapComponent from '../components/loadable-map'
// import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
// import "leaflet/dist/leaflet.css";
// import L from "leaflet";

// Fix for marker icon issues in Leaflet
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
//   iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
//   shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
// });

const {Header, Content} = Layout
const {Search} = Input

const stores = [
  {
    name: "Store 1",
    address: "123 Main St, City A",
    coordinates: [40.748817, -73.985428], // Coordinates for New York
  },
  {
    name: "Store 2",
    address: "456 Broadway, City B",
    coordinates: [34.052235, -118.243683], // Coordinates for Los Angeles
  },
  {
    name: "Store 3",
    address: "789 Elm St, City C",
    coordinates: [51.507351, -0.127758], // Coordinates for London
  }
]

/**
 * StoreFinder
 * 
 * @returns 
 */
const StoreFinder = () => {
  const [filteredStores, setFilteredStores] = useState(stores)

  const handleSearch = (value) => {
    const filtered = stores.filter((store) =>
      store.name.toLowerCase().includes(value.toLowerCase()) ||
      store.address.toLowerCase().includes(value.toLowerCase())
    )
    setFilteredStores(filtered)
  }
  
  return (
        <Layout>
            <Helmet>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
            </Helmet>
            <Header style={{ color: "white", fontSize: "24px", textAlign: "center" }}>
                Store Finder
            </Header>
            <Content style={{ padding: "20px 50px" }}>
                <Search
                    placeholder="Search for a store"
                    enterButton
                    onSearch={handleSearch}
                    style={{ marginBottom: "20px" }}
                />
                <Row gutter={16}>
                    <Col span={12}>
                        <List
                            itemLayout="vertical"
                            size="large"
                            dataSource={filteredStores}
                            renderItem={(store) => (
                                <List.Item>
                                    <Card title={store.name} bordered={false}>
                                        <p>
                                            <EnvironmentOutlined /> {store.address}
                                        </p>
                                    </Card>
                                </List.Item>
                            )}
                        />
                    </Col>
                    <Col span={12}>
                        {typeof window !== "undefined" && 
                            <LoadableMapComponent 
                                containerProps={{center: [40.748817, -73.985428], zoom: 2}} 
                                markers={filteredStores.map((store, index) => ({name: store.name, text: store.address, position: store.coordinates, }))}
                            />
                        }
                    </Col>
                </Row>
            </Content>
        </Layout>
    )
}

export default StoreFinder