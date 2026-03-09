import { createContext, useContext, useState, useEffect } from 'react'

// Initial demo data
const initialData = {
    departments: [
        { id: 1, name: 'MERN DEC BATCH 01', code: 'mern1dec25', students: 45 },
        { id: 2, name: 'MERN JAN BATCH 02', code: 'mern2jan26', students: 32 },
        { id: 3, name: 'MEAN FEB BATCH 01', code: 'mean1feb26', students: 28 },
        { id: 4, name: 'JAVA FS MAR BATCH 01', code: 'java1mar26', students: 15 },
        { id: 5, name: 'SDET APR BATCH 01', code: 'sdet1apr26', students: 20 },
    ],
    batches: [
        { id: 1, name: 'MERN DEC BATCH 01', code: 'mern1dec25', students: 45 },
        { id: 2, name: 'MERN JAN BATCH 02', code: 'mern2jan26', students: 32 },
        { id: 3, name: 'MEAN FEB BATCH 01', code: 'mean1feb26', students: 28 },
        { id: 4, name: 'JAVA FS MAR BATCH 01', code: 'java1mar26', students: 15 },
        { id: 5, name: 'SDET APR BATCH 01', code: 'sdet1apr26', students: 20 },
    ],
    students: [
        { id: 1, name: 'John Doe', email: 'john@example.com', department: 'MERN', rollNumber: 'MERN2024001' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', department: 'MEAN', rollNumber: 'MEAN2024001' },
        { id: 3, name: 'Mike Johnson', email: 'mike@example.com', department: 'JAVA_FS', rollNumber: 'JAVA2024001' },
        { id: 4, name: 'Sarah Wilson', email: 'sarah@example.com', department: 'SDET_JAVA', rollNumber: 'SDET2024001' },
        { id: 5, name: 'Chris Brown', email: 'chris@example.com', department: 'MERN', rollNumber: 'MERN2024002' },
    ],
    teachers: [
        { id: 1, name: 'Prof. Robert Kumar', email: 'robert@college.edu', department: 'MERN', username: 'robert_k', status: 'Active' },
        { id: 2, name: 'Dr. Emily Chen', email: 'emily@college.edu', department: 'MEAN', username: 'emily_c', status: 'Active' },
        { id: 3, name: 'Prof. David Lee', email: 'david@college.edu', department: 'JAVA_FS', username: 'david_l', status: 'Active' },
        { id: 4, name: 'Dr. Lisa Patel', email: 'lisa@college.edu', department: 'SDET_JAVA', username: 'lisa_p', status: 'Active' },
    ],
}

const DataContext = createContext()

export const useData = () => {
    const context = useContext(DataContext)
    if (!context) {
        throw new Error('useData must be used within a DataProvider')
    }
    return context
}

export const DataProvider = ({ children }) => {
    const [data, setData] = useState(() => {
        // Clear old data and use fresh initial data
        localStorage.removeItem('attendease_data')
        return initialData
    })

    // Save to localStorage whenever data changes
    useEffect(() => {
        localStorage.setItem('attendease_data', JSON.stringify(data))
    }, [data])

    // Generic CRUD operations
    const addItem = (collection, item) => {
        const newId = Math.max(...data[collection].map(i => i.id), 0) + 1
        setData(prev => ({
            ...prev,
            [collection]: [...prev[collection], { ...item, id: newId }]
        }))
        return newId
    }

    const updateItem = (collection, id, updates) => {
        setData(prev => ({
            ...prev,
            [collection]: prev[collection].map(item =>
                item.id === id ? { ...item, ...updates } : item
            )
        }))
    }

    const deleteItem = (collection, id) => {
        setData(prev => ({
            ...prev,
            [collection]: prev[collection].filter(item => item.id !== id)
        }))
    }

    const getItem = (collection, id) => {
        return data[collection].find(item => item.id === id)
    }

    // Reset to initial data
    const resetData = () => {
        setData(initialData)
        localStorage.setItem('attendease_data', JSON.stringify(initialData))
    }

    // Stats for dashboard
    const getStats = () => ({
        totalDepartments: data.departments.length,
        totalBatches: data.batches.length,
        totalTeachers: data.teachers.length,
        totalStudents: data.students.length,
    })

    return (
        <DataContext.Provider value={{
            departments: data.departments,
            batches: data.batches,
            students: data.students,
            teachers: data.teachers,
            addItem,
            updateItem,
            deleteItem,
            getItem,
            resetData,
            getStats,
        }}>
            {children}
        </DataContext.Provider>
    )
}

export default DataContext
