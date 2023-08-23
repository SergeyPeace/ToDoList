(function () {
    // создаём и возвращаем заголовок приложения
    function createAppTitle(title) {
        let appTitle = document.createElement('h2');
        appTitle.innerHTML = title;
        return appTitle;
    }

    // создаем и возвращаем форму для создания дела
    function createTodoItemForm() {
        let form = document.createElement('form');
        let input = document.createElement('input');
        let buttonWrapper = document.createElement('div');
        let button = document.createElement('button');

        form.classList.add('input-group', 'mb-3');
        input.classList.add('form-control');
        input.placeholder = 'Введите название нового дела';
        buttonWrapper.classList.add('input-group-append');
        button.classList.add('btn', 'btn-primary');
        button.textContent = 'Добавить дело';
        //При создании кнопка недоступна
        button.setAttribute('disabled', 'disabled')

        buttonWrapper.append(button);
        form.append(input);
        form.append(buttonWrapper);

        return {
            form,
            input,
            button,
        };
    }

    // создаем и возвращаем список элементов
    function createTodoList() {
        let list = document.createElement('ul');
        list.classList.add('list-group');
        return list;
    }

    function createTodoItem(card) {
        let item = document.createElement('li');
        // кнопки помещаем в элемент, который красиво покажет их в одной группе
        let buttonGroup = document.createElement('div');
        let doneButton = document.createElement('button');
        let deleteButton = document.createElement('button');

        // устанавливаем стили для элемента списка, а также для размещения кнопок
        // в его правой части с помощью flex
        item.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
        item.textContent = card.name;

        buttonGroup.classList.add('btn-group', 'btn-group-sm');
        doneButton.classList.add('btn', 'btn-success');
        doneButton.textContent = 'Готово';
        deleteButton.classList.add('btn', 'btn-danger');
        deleteButton.textContent = 'Удалить';

        // вкладываем кнопки в отдельный элемент, чтобы они объединились в один блок
        buttonGroup.append(doneButton);
        buttonGroup.append(deleteButton);
        item.append(buttonGroup);

        //приложению нужен доступ к самому элементу и кнопкам, чтобы обрабатывать события нажатия
        return {
            item,
            doneButton,
            deleteButton,
            card
        };
    }

    //объект с методами для работы с локальным хранилищем
    workLocalStorage = {
        dataToJson(data){
            return JSON.stringify(data)
        },
        jsonToData(data){
            return JSON.parse(data)
        },
        getCardsArr(id){
            return localStorage.getItem(id) || '[]'
        },
        setCardsArr(id, data){
            localStorage.setItem(id, data)
        },

        getCardsObjects(id){
            return this.jsonToData(this.getCardsArr(id))
        },
        setCardsString(id, data){
            this.setCardsArr(id, this.dataToJson(data))
        },
    }

    function createTodoApp(container, title = 'Список дел', listName) {
        let todoAppTitle = createAppTitle(title);
        let todoItemForm = createTodoItemForm();
        let todoList = createTodoList();

        container.append(todoAppTitle);
        container.append(todoItemForm.form);
        container.append(todoList);

        //счетчик id
        function makeCounter(setCounter) {
            let counter = setCounter+1;
            return function () {
                return counter++;
            }
        }

        //массив дел и подключение счетчика id
        let todoItemArr = workLocalStorage.getCardsObjects(listName); 
        let counter = makeCounter(todoItemArr[todoItemArr.length-1]?.id ?? 0);


        //добавление в массив
        function addTodoItemArr(todoItem) {
            todoItem.id = counter();
            todoItemArr.push(todoItem);
            return todoItem;
        }

        function addDoneButton(todoItem){
            //Добавляем класс для выполненных загруженных карт
            todoItem.card.done 
                ? todoItem.item.classList.add('list-group-item-success')
                : null;

            todoItem.doneButton.addEventListener('click', function () {
                if (todoItem.card.done) {
                    todoItem.item.classList.remove('list-group-item-success');
                    todoItem.card.done = false;
                } else {
                    todoItem.item.classList.add('list-group-item-success');
                    todoItem.card.done = true;
                }
                //Внести изменения в локальное хранилище
                workLocalStorage.setCardsString(listName, todoItemArr);
            });
        };

        function addDeleteButton(todoItem){
            todoItem.deleteButton.addEventListener('click', function () {
                if (confirm('Вы уверены?')) {
                    //удаляем из массива
                    let todoIndex = todoItemArr.indexOf(
                        todoItemArr.find(item => item.id == todoItem.card.id)
                    );
                    todoItemArr.splice(todoIndex, 1);
                    //удаляем из DOM
                    todoItem.item.remove();
                    delete todoItem.card;
                    //Внести изменения в локальное хранилище
                    workLocalStorage.setCardsString(listName, todoItemArr);
                }
            })
        };

        //добваление элементов из массива на страницу в момент создания приложения
        todoItemArr.forEach(card => {
            let todoItem = createTodoItem(card)
            addDoneButton(todoItem);
            addDeleteButton(todoItem);
            todoList.append(todoItem.item);
        });

        //отключение кнопки формы при отсутсвии значения
        todoItemForm.input.addEventListener('input', () => {
            todoItemForm.input.value
                ? todoItemForm.button.removeAttribute('disabled')
                : todoItemForm.button.setAttribute('disabled', 'disabled');
        });

        //браузер создает событие sumbit на форме по нажатию на Enter или на кнопку создания дела
        todoItemForm.form.addEventListener('submit', function (e) {
            //эта строчка необходима, чтобы предотвратить стандартное действие браузера
            //в данном случае мы не хотим, чтобы страница перезагружалась при отправке формы
            e.preventDefault();

            //игнорируем создание элемента, если пользователь ничего не ввел в поле
            if (!todoItemForm.input.value) {
                return;
            }

            //создание карточки дела
            let todoItem = createTodoItem(
                addTodoItemArr(
                    { name: todoItemForm.input.value, done: false }
                ),
            );

            //добавляем обработчики на кнопки
            addDoneButton(todoItem);
            addDeleteButton(todoItem);

            //создаем и добовляем в список новое дело с названием из поля для ввода
            todoList.append(todoItem.item);
            //обнуляем значение в поле, чтобы не пришлось стирать его вручную
            todoItemForm.input.value = '';
            todoItemForm.button.setAttribute('disabled', 'disabled');
            //Внести изменения в локальное хранилище
            workLocalStorage.setCardsString(listName, todoItemArr);
        });
    }
    window.createTodoApp = createTodoApp;
})();