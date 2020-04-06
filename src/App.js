import React, { useState } from "react";
import { gql } from "apollo-boost";
import { useQuery, useMutation, useSubscription } from "@apollo/react-hooks";

const GET_TODOS = gql`
  query getTodos {
    todos {
      done
      id
      text
    }
  }
`;

const TOGGLE_TODO = gql`
  mutation toggleTodo($id: uuid!, $done: Boolean!) {
    update_todos(where: { id: { _eq: $id } }, _set: { done: $done }) {
      returning {
        id
        text
        done
      }
    }
  }
`;

const DELETE_TODO = gql`
  mutation deleteTodo($id: uuid!) {
    delete_todos(where: { id: { _eq: $id } }) {
      returning {
        id
        text
        done
      }
    }
  }
`;

const ADD_TODO = gql`
  mutation addTodos($text: String!) {
    insert_todos(objects: { text: $text }) {
      returning {
        done
        id
        text
      }
    }
  }
`;

function App() {
  const { data, loading, error } = useQuery(GET_TODOS);
  const [text, setText] = useState("");
  const [toggleTodo] = useMutation(TOGGLE_TODO);
  const [deleteTodo] = useMutation(DELETE_TODO);
  const [addTodo] = useMutation(ADD_TODO, {
    onCompleted: () => setText(""),
  });

  if (error) return <div>Error fetching todos</div>;

  if (loading) return <div>Loading....</div>;

  const handleToggleTodo = async (todo) => {
    const data = await toggleTodo({
      variables: { id: todo.id, done: !todo.done },
    });
    console.log(data);
  };

  const handleDeleteTodo = async (id) => {
    const isConfirmed = window.confirm('Sigur vrei sa stergi ?')
    if(isConfirmed){
    const data = await deleteTodo({
      variables: { id },
      update:cache=>{
        const prevData = cache.readQuery({query:GET_TODOS})
        const newTodos =prevData.todos.filter(todo=>todo.id!==id);
        cache.writeQuery({query:GET_TODOS,data:{todos:newTodos}})
      }
    });
  }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const data = await addTodo({
      variables: { text },
      refetchQueries: [{ query: GET_TODOS }],
    });
    console.log(data);
  };

  return (
    <div className="vh-100 code flex flex-column items-center bg-purple white pa4 fl-1">
      <h1 className="f2-l">
        GraphQL checklist <span role="img" aria-label="Checkmark"></span>
      </h1>
      <form className="mb3" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Write your todo"
          className="pa2 f4 b--dashed"
          onChange={(e) => setText(e.target.value)}
          value={text}
        />
        <button type="submit" className="pa2 f4 bg-green">
          Create
        </button>
      </form>
      <div className="flex items-center justify-center flex-column">
        {data.todos.map((todo) => (
          <p onDoubleClick={() => handleToggleTodo(todo)} key={todo.id}>
            <span
              className={`pointer list pa1 f3 ${todo.done ? `strike` : ""}`}
            >
              {todo.text}
            </span>
            <button
              onClick={() => handleDeleteTodo(todo.id)}
              className="bg-transparent bn f4 pointer"
            >
              <span className="red">&times;</span>
            </button>
          </p>
        ))}
      </div>
    </div>
  );
}

export default App;
