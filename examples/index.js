import { SimpleMenu } from '../src';

const mySuperItem = document.getElementById('#superDuperItem');

if (mySuperItem) {
  const test = document.createElement('b');
  test.innerText = 'Sous Menu';
  
  new SimpleMenu(
    mySuperItem,
    {
      action1: () => {
        console.log('Hey !');
      },
      'sub actions': {
        sa1: '<i>Bonjour</i>',
        sa2: (ev, el) => {
          console.log(ev.target, el);
        },
      },
      'action 3e': {
        label: 'Action avec label et action',
        action: () => {
          console.log('ça marche');
        },
      },
      action6: () => {
        console.log('Hey !');
      },
      act: 'ACTION !',
      dqisdq: {
        label: test,
        sub: {
          action1: () => {
            console.log('Hey !');
          },
          'sub actions': {
            sa1: 'jour',
          },
        },
      },
      edit: {
        label: (() => {
          const cont = document.createElement('span');
          const icon = document.createElement('i');
          icon.classList.add('fas', 'fa-edit');
          cont.appendChild(icon);
          cont.append('Editer');
          return cont;
        })(),
        action: (ev, msg) => {
          console.log('edit', msg);
        },
      },
    },
    {
      quitAfterClick: true,
      fontAwesomePrefix: 'fas',
    }
  );
}
