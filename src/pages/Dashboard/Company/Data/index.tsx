import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from 'hooks/auth';
import { MdDomain, MdPlace } from 'react-icons/md';
import api from 'services/api';
import DashboardInput from 'components/Input/DashboardInput';
import Select from 'components/Select';
import { FormHandles } from '@unform/core';
import * as yup from 'yup';
import ErrorCatcher from 'errors/errorCatcher';
import { useToast } from 'hooks/toast';
import {
  Container,
  CompanyIcon,
  CompanyImage,
  Form,
  InputLine,
} from './styles';

interface ICompany {
  id: string;
  name: string;
  cnpj: number;
  address: string;
  logo?: string;
}

interface OptionProps {
  [key: string]: string;
}

interface IBrazilianState extends OptionProps {
  id: string;
  nome: string;
  sigla: string;
}

interface IBrazilianCity extends OptionProps {
  id: string;
  nome: string;
  [key: string]: string;
}

const CompanyData: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const formRef = useRef<FormHandles>(null);

  const [company, setCompany] = useState<ICompany>({} as ICompany);

  const [allStates, setAllStates] = useState<IBrazilianState[]>([]);
  const [selectedState, setSelectedState] = useState<IBrazilianState>(
    {} as IBrazilianState,
  ); // Id of first state on API

  const [stateCities, setStateCities] = useState<IBrazilianCity[]>([]);
  const [selectedCity, setSelectedCity] = useState<IBrazilianCity>(
    {} as IBrazilianCity,
  );

  const apiStaticUrl = `${api.defaults.baseURL}/files`;

  useEffect(() => {
    api.get('/company').then(response => {
      setCompany(response.data);
    });
  }, []);

  useEffect(() => {
    if (company.address) {
      api
        .get<IBrazilianState[]>(
          'https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome',
          {
            baseURL: '',
          },
        )
        .then(({ data }) => {
          setAllStates(data);
          setSelectedState(
            () =>
              data.find(
                ({ sigla }) => sigla === company.address.split('/')[1],
              ) || data[0],
          );
        });
    }
  }, [company.address]);

  useEffect(() => {
    if (selectedState.id && company.address) {
      api
        .get<IBrazilianCity[]>(
          `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedState.id}/municipios?orderBy=nome`,
        )
        .then(({ data }) => {
          setStateCities(data);
          setSelectedCity(
            () =>
              data.find(({ nome }) => nome === company.address.split('/')[0]) ||
              data[0],
          );
        });
    }
  }, [selectedState.id, company.address]);

  const handleSubmit = useCallback(
    async (companyData: ICompany) => {
      try {
        const schema = yup.object().shape({
          name: yup.string().required('Nome da empresa obrigatório'),
          cnpj: yup
            .string()
            .required('CNPJ obrigatório')
            .min(14, 'O tamanho mínimo do cnpj é de 14 dígitos'),
        });

        await schema.validate(companyData, {
          abortEarly: false,
        });

        await api.put('/company/', {
          ...companyData,
          address: `${selectedCity.nome}/${selectedState.sigla}`,
        });

        showToast({
          type: 'success',
          text: {
            main: 'Atualização bem sucedida',
            sub: 'Empresa atualizada com sucesso',
          },
        });
      } catch (err) {
        ErrorCatcher(err as Error | yup.ValidationError, formRef);
      }
    },
    [selectedState.sigla, selectedCity.nome, showToast],
  );

  return (
    <Container>
      {selectedCity.id && (
        <>
          <CompanyIcon>
            {company.logo ? (
              <CompanyImage src={`${apiStaticUrl}/logo/${company.logo}`} />
            ) : (
              <MdDomain size={180} color="#1c274e" />
            )}
          </CompanyIcon>

          <Form ref={formRef} initialData={company} onSubmit={handleSubmit}>
            <InputLine>
              <DashboardInput
                name="name"
                placeholder="Nome da empresa"
                Icon={MdDomain}
                disabled={!user.isAdmin}
              />

              <DashboardInput
                name="cnpj"
                placeholder="CNPJ"
                Icon={MdDomain}
                disabled={!user.isAdmin}
              />
            </InputLine>

            <InputLine>
              <Select
                data={allStates}
                optionValueReference="nome"
                placeHolder="Estado"
                Icon={MdPlace}
                setFunction={optionId =>
                  setSelectedState(
                    allStates.find(({ id }) => id === optionId) ||
                      ({} as IBrazilianState),
                  )
                }
                isOfDashboard
                initialOptionPosition={allStates.findIndex(
                  ({ id }) => selectedState.id === id,
                )}
                disabled={!user.isAdmin}
              />

              <Select
                data={stateCities}
                optionValueReference="nome"
                placeHolder="Cidade"
                Icon={MdPlace}
                setFunction={optionId =>
                  setSelectedCity(
                    stateCities.find(({ id }) => id === optionId) ||
                      ({} as IBrazilianCity),
                  )
                }
                isOfDashboard
                initialOptionPosition={stateCities.findIndex(
                  ({ id }) => selectedCity.id === id,
                )}
                disabled={!user.isAdmin}
              />
            </InputLine>
          </Form>
        </>
      )}
    </Container>
  );
};

export default CompanyData;