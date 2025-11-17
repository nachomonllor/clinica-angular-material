import { inject, Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import type {
  LoginLog,
  TurnosPorEspecialidad,
  TurnosPorDia,
  TurnosPorMedico,
  QueryReportParams,
} from "../models/report.model";

import { API_BASE_URL } from "../utils/api-config";

@Injectable({
  providedIn: "root",
})
export class ReportsService {
  private http = inject(HttpClient);

  getLogins(params?: QueryReportParams) {
    let httpParams = new HttpParams();
    if (params?.desde) httpParams = httpParams.set("desde", params.desde);
    if (params?.hasta) httpParams = httpParams.set("hasta", params.hasta);
    if (params?.userId) httpParams = httpParams.set("userId", params.userId);

    return this.http.get<LoginLog[]>(`${API_BASE_URL}/admin/reports/logins`, {
      params: httpParams,
      withCredentials: true,
    });
  }

  getTurnosPorEspecialidad(params?: QueryReportParams) {
    let httpParams = new HttpParams();
    if (params?.desde) httpParams = httpParams.set("desde", params.desde);
    if (params?.hasta) httpParams = httpParams.set("hasta", params.hasta);

    return this.http.get<TurnosPorEspecialidad[]>(
      `${API_BASE_URL}/admin/reports/turnos-por-especialidad`,
      {
        params: httpParams,
        withCredentials: true,
      },
    );
  }

  getTurnosPorDia(params?: QueryReportParams) {
    let httpParams = new HttpParams();
    if (params?.desde) httpParams = httpParams.set("desde", params.desde);
    if (params?.hasta) httpParams = httpParams.set("hasta", params.hasta);

    return this.http.get<TurnosPorDia[]>(
      `${API_BASE_URL}/admin/reports/turnos-por-dia`,
      {
        params: httpParams,
        withCredentials: true,
      },
    );
  }

  getTurnosPorMedico(params?: QueryReportParams) {
    let httpParams = new HttpParams();
    if (params?.desde) httpParams = httpParams.set("desde", params.desde);
    if (params?.hasta) httpParams = httpParams.set("hasta", params.hasta);
    if (params?.soloFinalizados !== undefined)
      httpParams = httpParams.set("soloFinalizados", params.soloFinalizados.toString());

    return this.http.get<TurnosPorMedico[]>(
      `${API_BASE_URL}/admin/reports/turnos-por-medico`,
      {
        params: httpParams,
        withCredentials: true,
      },
    );
  }

  getTurnosFinalizadosPorMedico(params?: QueryReportParams) {
    let httpParams = new HttpParams();
    if (params?.desde) httpParams = httpParams.set("desde", params.desde);
    if (params?.hasta) httpParams = httpParams.set("hasta", params.hasta);

    return this.http.get<TurnosPorMedico[]>(
      `${API_BASE_URL}/admin/reports/turnos-finalizados-por-medico`,
      {
        params: httpParams,
        withCredentials: true,
      },
    );
  }
}

