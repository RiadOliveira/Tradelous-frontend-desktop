import React, { useCallback, useState } from 'react';
import { useTransition } from 'react-spring';
import { useAuth } from 'hooks/auth';
import { RiArchiveFill } from 'react-icons/ri';
import { MdDomain, MdPerson, MdShoppingBasket } from 'react-icons/md';
import { IconType } from 'react-icons';
import api from 'services/api';
import { useModal } from 'hooks/modal';
import {
  Container,
  MainContent,
  MainScreenContent,
  SecondaryContent,
  UserBar,
  UserAvatar,
  UserName,
  ListOfScreen,
  SelectScreenBar,
  SelectedScreenContent,
  SelectedScreen,
} from './styles';

import Company from './Company';
import Products from './Products';
import Profile from './Profile';
import Sales from './Sales';

interface Screen {
  name: string;
  text: string;
  Icon: IconType;
  Component: {
    data: React.FC;
    secondaryData: React.FC;
  };
}

const screens: Record<string, Screen> = {
  company: {
    name: 'company',
    text: 'Empresa',
    Icon: MdDomain,
    Component: Company,
  },
  profile: {
    name: 'profile',
    text: 'Perfil',
    Icon: MdPerson,
    Component: Profile,
  },
  products: {
    name: 'products',
    text: 'Produtos',
    Icon: RiArchiveFill,
    Component: Products,
  },
  sales: {
    name: 'sales',
    text: 'Vendas',
    Icon: MdShoppingBasket,
    Component: Sales,
  },
};

const keys = Object.keys(screens);

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const { showModal } = useModal();
  const [selectedScreen, setSelectedScreen] = useState<Screen>(screens.company);

  const apiStaticUrl = `${api.defaults.baseURL}/files`;

  const screenTransitions = useTransition(selectedScreen, {
    from: {
      marginLeft: '-1000px',
      opacity: 0,
    },
    enter: {
      marginLeft: '0px',
      opacity: 1,
      delay: 300,
    },
    leave: {
      opacity: 0,
      marginLeft: '1000px',
      position: 'absolute',
    },
    config: {
      duration: 800,
    },
  });

  const handleScreenChange = useCallback(() => {
    setSelectedScreen(value => {
      if (user.companyId) {
        return screens[
          keys[keys.indexOf(value.name) + (value.name === 'sales' ? -3 : 1)]
        ];
      }

      return screens[
        keys[keys.indexOf(value.name) + (value.name === 'profile' ? -1 : 1)]
      ];
    });
  }, [user.companyId]);

  return (
    <Container>
      <MainContent>
        <MainScreenContent>
          <selectedScreen.Component.data />
        </MainScreenContent>

        <SelectScreenBar onClick={handleScreenChange}>
          {screenTransitions(
            (style, item) =>
              item && (
                <SelectedScreenContent style={style}>
                  <item.Icon size={110} color="#fff" />

                  <SelectedScreen>{item.text}</SelectedScreen>
                </SelectedScreenContent>
              ),
          )}
        </SelectScreenBar>
      </MainContent>

      <SecondaryContent>
        <UserBar
          onClick={() =>
            showModal({
              text: 'Tem certeza que deseja sair de sua conta?',
              buttonsProps: {
                first: {
                  actionFunction: signOut,
                  color: '#49b454',
                  text: 'Sim',
                },
                second: {
                  actionFunction: () => undefined,
                  color: '#db3b3b',
                  text: 'Não',
                },
              },
              type: 'ordinary',
            })
          }
        >
          {user.avatar ? (
            <UserAvatar src={`${apiStaticUrl}/avatar/${user.avatar}`} />
          ) : (
            <MdPerson size={96} color="#1c274e" />
          )}

          <UserName>{user.name}</UserName>
        </UserBar>

        <ListOfScreen>
          <selectedScreen.Component.secondaryData />
        </ListOfScreen>
      </SecondaryContent>
    </Container>
  );
};

export default Dashboard;
