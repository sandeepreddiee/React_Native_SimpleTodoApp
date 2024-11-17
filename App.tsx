import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  FlatList,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [task, setTask] = useState('');
  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    saveTasks();
  }, [tasks]);

  const saveTasks = async () => {
    try {
      const jsonTasks = JSON.stringify(
        tasks.map(task => ({
          id: task.id,
          text: task.text,
          completed: task.completed,
        })),
      );
      await AsyncStorage.setItem('tasks', jsonTasks);
    } catch (e) {
      console.error('Failed to save tasks', e);
    }
  };

  const loadTasks = async () => {
    try {
      const jsonTasks = await AsyncStorage.getItem('tasks');
      if (jsonTasks) {
        const loadedTasks = JSON.parse(jsonTasks).map(task => ({
          ...task,
          opacity: new Animated.Value(0),
          scale: new Animated.Value(0.8),
          height: new Animated.Value(70),
          translateX: new Animated.Value(Dimensions.get('window').width),
        }));
        setTasks(loadedTasks);

        // Animate all loaded tasks
        loadedTasks.forEach((task, index) => {
          Animated.sequence([
            Animated.delay(index * 100), // Stagger the animations
            Animated.parallel([
              Animated.timing(task.opacity, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
              }),
              Animated.spring(task.scale, {
                toValue: 1,
                friction: 4,
                useNativeDriver: true,
              }),
            ]),
          ]).start();
        });
      }
    } catch (e) {
      console.error('Failed to load tasks', e);
    }
  };

  const addTask = () => {
    if (task.trim()) {
      const opacity = new Animated.Value(0);
      const scale = new Animated.Value(0.8);
      const height = new Animated.Value(70);
      const translateX = new Animated.Value(Dimensions.get('window').width);

      const newTask = {
        id: Date.now().toString(),
        text: task,
        completed: false,
        opacity,
        scale,
        height,
        translateX,
      };

      setTasks(prevTasks => [...prevTasks, newTask]);
      setTask('');

      // Animate the new task appearing
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.spring(translateX, {
          toValue: 0,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const deleteTask = taskId => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (!taskToDelete) return;

    // Animate the task disappearing
    Animated.parallel([
      Animated.timing(taskToDelete.opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(taskToDelete.scale, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(taskToDelete.translateX, {
        toValue: -Dimensions.get('window').width,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTasks(prevTasks => prevTasks.filter(item => item.id !== taskId));
    });
  };

  const toggleComplete = taskId => {
    setTasks(prevTasks =>
      prevTasks.map(item => {
        if (item.id === taskId) {
          // Animate scale on completion toggle
          Animated.sequence([
            Animated.timing(item.scale, {
              toValue: 0.95,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.spring(item.scale, {
              toValue: 1,
              friction: 4,
              useNativeDriver: true,
            }),
          ]).start();
          return {...item, completed: !item.completed};
        }
        return item;
      }),
    );
  };

  const startEditing = taskToEdit => {
    setEditingTask(taskToEdit);
    setTask(taskToEdit.text);

    // Animate the task being edited
    Animated.sequence([
      Animated.timing(taskToEdit.scale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(taskToEdit.scale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const editTask = () => {
    if (task.trim()) {
      setTasks(prevTasks =>
        prevTasks.map(item =>
          item.id === editingTask.id ? {...item, text: task} : item,
        ),
      );
      setEditingTask(null);
      setTask('');
    }
  };

  const handleAddOrEditTask = () => {
    if (editingTask) {
      editTask();
    } else {
      addTask();
    }
  };

  const renderItem = ({item}) => (
    <Animated.View
      style={[
        styles.taskContainer,
        {
          opacity: item.opacity,
          transform: [{scale: item.scale}, {translateX: item.translateX}],
        },
      ]}>
      <TouchableOpacity
        style={styles.checkBox}
        onPress={() => toggleComplete(item.id)}>
        <Text style={styles.checkBoxText}>{item.completed ? '✓' : ''}</Text>
      </TouchableOpacity>
      <Text
        style={[styles.taskText, item.completed && styles.completedTaskText]}>
        {item.text}
      </Text>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => startEditing(item)}>
          <Text style={styles.editIcon}>✎</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => deleteTask(item.id)}>
          <Text style={styles.deleteIcon}>×</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enhanced To-Do List</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add or edit a task"
          value={task}
          onChangeText={setTask}
          onSubmitEditing={handleAddOrEditTask}
        />
        <TouchableOpacity
          style={[styles.addButton, editingTask && styles.editButton]}
          onPress={handleAddOrEditTask}>
          <Text style={styles.addButtonText}>{editingTask ? '✓' : '+'}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={tasks}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginRight: 10,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#5C5CFF',
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  editButton: {
    backgroundColor: '#4CAF50',
  },
  addButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: 20,
  },
  taskContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  checkBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#5C5CFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkBoxText: {
    color: '#5C5CFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  completedTaskText: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 5,
    marginLeft: 10,
  },
  editIcon: {
    fontSize: 20,
    color: '#4CAF50',
  },
  deleteIcon: {
    fontSize: 24,
    color: '#FF5C5C',
    fontWeight: 'bold',
  },
});
