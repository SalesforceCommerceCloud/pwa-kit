import React, { useState } from 'react';
import { Box, Container, Flex, Heading, Text, VStack } from '@salesforce/retail-react-app/app/components/shared/ui';
import ShowcaseTopBar from '@salesforce/retail-react-app/app/components/shared/ShowcaseTopBar';
import { Table, Thead, Tbody, Tr, Th, Td } from '@chakra-ui/react';
import { EditIcon } from '@chakra-ui/icons';

const StoreConfig = () => {
    const [editableField, setEditableField] = useState(null);
    const [fieldValues, setFieldValues] = useState({
        templateExtensibility: 'No',
        projectName: 'wei-test',
        commerceCloudURL: 'https://zzrf-001.dx.commercecloud.salesforce.com/',
        slasClientId: '987fc116-d30c-4537-93cb-c2bd433c3b5a',
        slasClientPrivate: 'Yes',
        siteId: 'RefArch',
        commerceApiOrgId: 'f_ecom_zzrf_001',
        commerceApiShortCode: 'kv7kzm78'
    });

    const handleEditClick = (field) => {
        setEditableField(field);
    };

    const handleInputChange = (e, field) => {
        setFieldValues({
            ...fieldValues,
            [field]: e.target.value
        });
    };

    const handleBlur = () => {
        setEditableField(null);
    };

    return (
        <Box data-testid="store-config-page" layerStyle="page">
            <ShowcaseTopBar />
            <Container maxW="container.2xl" py={8}>
                <Flex direction={{base: 'column', md: 'row'}} gap={8} align="flex-start">
                    {/* Sidebar */}
                    <Box
                        minW={{base: '100%', md: '260px'}}
                        maxW={{base: '100%', md: '260px'}}
                        borderWidth="1px"
                        borderRadius="lg"
                        bg="white"
                        p={4}
                        shadow="sm"
                    >
                        <VStack align="stretch" spacing={1}>
                            <Text>StoreConfig Sidebar</Text>
                        </VStack>
                    </Box>
                    {/* Main Content Area */}
                    <Box
                        flex={1}
                        borderWidth="1px"
                        borderRadius="lg"
                        bg="white"
                        p={8}
                        shadow="sm"
                        minH="320px"
                    >
                        <Heading size="lg" color="blue.600" mb={2}>
                            Store Config
                        </Heading>
                        <Text color="gray.600" mb={4}>
                            Welcome to the Store Config page!
                        </Text>
                        <Table variant="simple" size="md" mt={8}>
                            <Thead>
                                <Tr>
                                    <Th>Field</Th>
                                    <Th>Value</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                <Tr>
                                    <Td>Do you wish to use template extensibility?</Td>
                                    <Td display="flex" justifyContent="space-between" alignItems="center">
                                        {editableField === 'templateExtensibility' ? (
                                            <input
                                                value={fieldValues.templateExtensibility}
                                                onChange={(e) => handleInputChange(e, 'templateExtensibility')}
                                                onBlur={handleBlur}
                                                autoFocus
                                            />
                                        ) : (
                                            <span>{fieldValues.templateExtensibility}</span>
                                        )}
                                        <EditIcon cursor="pointer" boxSize={4} onClick={() => handleEditClick('templateExtensibility')} />
                                    </Td>
                                </Tr>
                                <Tr>
                                    <Td>What is the name of your Project?</Td>
                                    <Td display="flex" justifyContent="space-between" alignItems="center">
                                        {editableField === 'projectName' ? (
                                            <input
                                                value={fieldValues.projectName}
                                                onChange={(e) => handleInputChange(e, 'projectName')}
                                                onBlur={handleBlur}
                                                autoFocus
                                            />
                                        ) : (
                                            <span>{fieldValues.projectName}</span>
                                        )}
                                        <EditIcon cursor="pointer" boxSize={4} onClick={() => handleEditClick('projectName')} />
                                    </Td>
                                </Tr>
                                <Tr>
                                    <Td>What is the URL for your Commerce Cloud instance?</Td>
                                    <Td display="flex" justifyContent="space-between" alignItems="center">
                                        {editableField === 'commerceCloudURL' ? (
                                            <input
                                                value={fieldValues.commerceCloudURL}
                                                onChange={(e) => handleInputChange(e, 'commerceCloudURL')}
                                                onBlur={handleBlur}
                                                autoFocus
                                            />
                                        ) : (
                                            <span>{fieldValues.commerceCloudURL}</span>
                                        )}
                                        <EditIcon cursor="pointer" boxSize={4} onClick={() => handleEditClick('commerceCloudURL')} />
                                    </Td>
                                </Tr>
                                <Tr>
                                    <Td>What is your SLAS Client ID?</Td>
                                    <Td display="flex" justifyContent="space-between" alignItems="center">
                                        {editableField === 'slasClientId' ? (
                                            <input
                                                value={fieldValues.slasClientId}
                                                onChange={(e) => handleInputChange(e, 'slasClientId')}
                                                onBlur={handleBlur}
                                                autoFocus
                                            />
                                        ) : (
                                            <span>{fieldValues.slasClientId}</span>
                                        )}
                                        <EditIcon cursor="pointer" boxSize={4} onClick={() => handleEditClick('slasClientId')} />
                                    </Td>
                                </Tr>
                                <Tr>
                                    <Td>Is your SLAS client private?</Td>
                                    <Td display="flex" justifyContent="space-between" alignItems="center">
                                        {editableField === 'slasClientPrivate' ? (
                                            <input
                                                value={fieldValues.slasClientPrivate}
                                                onChange={(e) => handleInputChange(e, 'slasClientPrivate')}
                                                onBlur={handleBlur}
                                                autoFocus
                                            />
                                        ) : (
                                            <span>{fieldValues.slasClientPrivate}</span>
                                        )}
                                        <EditIcon cursor="pointer" boxSize={4} onClick={() => handleEditClick('slasClientPrivate')} />
                                    </Td>
                                </Tr>
                                <Tr>
                                    <Td>What is your Site ID in Business Manager?</Td>
                                    <Td display="flex" justifyContent="space-between" alignItems="center">
                                        {editableField === 'siteId' ? (
                                            <input
                                                value={fieldValues.siteId}
                                                onChange={(e) => handleInputChange(e, 'siteId')}
                                                onBlur={handleBlur}
                                                autoFocus
                                            />
                                        ) : (
                                            <span>{fieldValues.siteId}</span>
                                        )}
                                        <EditIcon cursor="pointer" boxSize={4} onClick={() => handleEditClick('siteId')} />
                                    </Td>
                                </Tr>
                                <Tr>
                                    <Td>What is your Commerce API organization ID in Business Manager?</Td>
                                    <Td display="flex" justifyContent="space-between" alignItems="center">
                                        {editableField === 'commerceApiOrgId' ? (
                                            <input
                                                value={fieldValues.commerceApiOrgId}
                                                onChange={(e) => handleInputChange(e, 'commerceApiOrgId')}
                                                onBlur={handleBlur}
                                                autoFocus
                                            />
                                        ) : (
                                            <span>{fieldValues.commerceApiOrgId}</span>
                                        )}
                                        <EditIcon cursor="pointer" boxSize={4} onClick={() => handleEditClick('commerceApiOrgId')} />
                                    </Td>
                                </Tr>
                                <Tr>
                                    <Td>What is your Commerce API short code in Business Manager?</Td>
                                    <Td display="flex" justifyContent="space-between" alignItems="center">
                                        {editableField === 'commerceApiShortCode' ? (
                                            <input
                                                value={fieldValues.commerceApiShortCode}
                                                onChange={(e) => handleInputChange(e, 'commerceApiShortCode')}
                                                onBlur={handleBlur}
                                                autoFocus
                                            />
                                        ) : (
                                            <span>{fieldValues.commerceApiShortCode}</span>
                                        )}
                                        <EditIcon cursor="pointer" boxSize={4} onClick={() => handleEditClick('commerceApiShortCode')} />
                                    </Td>
                                </Tr>
                            </Tbody>
                        </Table>
                    </Box>
                </Flex>
            </Container>
        </Box>
    );
};

export default StoreConfig; 