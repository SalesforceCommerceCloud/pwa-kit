import React from 'react'
import PropTypes from 'prop-types'
import { Box, Button, Heading, Stack, FormControl, FormLabel, FormHelperText, Input } from '@chakra-ui/react'

const FormBuilder = ({
    image,
    mainText,
    subText,
    imagePlacement,
    action,
    submitText,
    fields
}) => {

    return(
        <Box>
            <Heading>{mainText}</Heading>
            <Heading>{subText}</Heading>
            <form action={action}>
                <Stack spacing={4}>
                    {fields && fields.map((field, index) => (
                        <FormControl id={index}>
                            <FormLabel>{field.label}</FormLabel>
                            <Input type={field.type} name={field.name} />
                            <FormHelperText>{field.placeholder}</FormHelperText>
                        </FormControl>
                    ))}
                    <Stack spacing={4} direction='row' align='right'>
                        <Button>{submitText}</Button>
                    </Stack>
                </Stack>
            </form>
        </Box>
    )
}

FormBuilder.displayName = 'Form-Builder'

FormBuilder.propTypes = {
    image: PropTypes.shape({
        disablePoiAspectRatio: PropTypes.bool,
        imageAltText: PropTypes.string,
        seoText: PropTypes.string,
        _meta: PropTypes.shape({
            schema: PropTypes.string
        }),
        image: PropTypes.shape({
            aspectLock: PropTypes.string,
            bri: PropTypes.number,
            crop: PropTypes.arrayOf(PropTypes.number),
            fliph: PropTypes.bool,
            flipv: PropTypes.bool,
            hue: PropTypes.number,
            query: PropTypes.string,
            image: PropTypes.shape({
                defaultHost: PropTypes.string,
                endpoint: PropTypes.string,
                id: PropTypes.string,
                name: PropTypes.string,
                _meta: PropTypes.shape({
                    schema: PropTypes.string
                })
            }),
            poi: PropTypes.shape({
                x: PropTypes.number,
                y: PropTypes.number
            }),
            rot: PropTypes.number,
            sat: PropTypes.number
        })
    }),
    mainText: PropTypes.string,
    subText: PropTypes.string,
    imagePlacement: PropTypes.string,
    action: PropTypes.string,
    submitText: PropTypes.string,
    fields: PropTypes.arrayOf(
        PropTypes.shape({
            type: PropTypes.string,
            name: PropTypes.string,
            label: PropTypes.string,
            placeholder: PropTypes.string
        })
    )
}

export default FormBuilder