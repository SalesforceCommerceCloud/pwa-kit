// 1. create new component
import React from 'react'
import {useQuery} from '@tanstack/react-query'
import {
    Alert,
    AlertIcon,
    Box,
    Heading,
    Spinner,
    Stack,
    Text,
    Divider,
    useMultiStyleConfig
} from '@salesforce/retail-react-app/app/components/shared/ui'

const fetchTodos = async () => {
    const response = await fetch('https://jsonplaceholder.typicode.com/todos')
    if (!response.ok) {
        throw new Error('Network response was not ok')
    }
    return response.json()
}

const Todo = () => {
    // this will apply theme file from /theme/projects/todo
    const styles = useMultiStyleConfig('Todo')
    const {
        data: todos,
        isLoading,
        isError,
        error
    } = useQuery({
        queryKey: ['todos'],
        queryFn: fetchTodos
    })

    if (isLoading) {
        return (
            <Box textAlign="center" p={8} className="todo-loading" sx={styles.loading}>
                <Spinner size="xl" color="blue.500" />
                <Text mt={4}>Loading todos...</Text>
            </Box>
        )
    }

    if (isError) {
        return (
            <Alert status="error" className="todo-error" sx={styles.error}>
                <AlertIcon />
                <Text>Error loading todos: {error.message}</Text>
            </Alert>
        )
    }

    return (
        <Box
            className="todo-container"
            sx={styles.container}
            borderWidth="1px"
            borderRadius="lg"
            p={4}
        >
            <Heading size="md" mb={4} sx={styles.heading}>
                Todo List
            </Heading>
            <Divider mb={4} />
            <Stack spacing={3}>
                {todos?.slice(0, 10).map((todo) => (
                    <Box
                        key={todo.id}
                        p={3}
                        borderWidth="1px"
                        borderRadius="md"
                        className="todo-item"
                        sx={styles.item}
                    >
                        <Text
                            textDecoration={todo.completed ? 'line-through' : 'none'}
                            color={todo.completed ? 'gray.500' : 'inherit'}
                        >
                            {todo.title}
                        </Text>
                    </Box>
                ))}
            </Stack>
        </Box>
    )
}

export default Todo

// Render Todo in the home page
// app/pages/home/index.jsx
